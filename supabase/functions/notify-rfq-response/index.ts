// supabase/functions/notify-rfq-response/index.ts
// Deploy with: supabase functions deploy notify-rfq-response --project-ref sqghpsflohvmyejqohrk
// Then set up a Database Webhook in Supabase Dashboard:
//   Table: rfq_suppliers | Event: UPDATE | Filter: submitted_at IS NOT NULL
//   Target: Edge Function → notify-rfq-response

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const NOTIFICATION_EMAIL = Deno.env.get("NOTIFICATION_EMAIL") || "it@magayamining.co.zw";

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { record, old_record } = payload;

    // Only fire when submitted_at transitions from null to a value
    if (!record?.submitted_at || old_record?.submitted_at) {
      return new Response(JSON.stringify({ message: "Not a new submission" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get full details
    const { data: invite } = await supabase
      .from("rfq_suppliers")
      .select(`
        *,
        vendor:vendors(name, contact_name, contact_email),
        rfq:rfqs(ref_number, title, site_id, site:sites(name))
      `)
      .eq("id", record.id)
      .single();

    if (!invite) {
      return new Response(JSON.stringify({ error: "Invite not found" }), { status: 404 });
    }

    // Count responses
    const { data: allSuppliers } = await supabase
      .from("rfq_suppliers")
      .select("id, submitted_at")
      .eq("rfq_id", invite.rfq_id);

    const totalInvited = allSuppliers?.length || 0;
    const totalSubmitted = allSuppliers?.filter((s: any) => s.submitted_at).length || 0;

    // Auto-update RFQ status
    const newStatus = totalSubmitted >= totalInvited ? "complete" : "partial";
    await supabase
      .from("rfqs")
      .update({ status: newStatus })
      .eq("id", invite.rfq_id);

    // Build notification payload
    // In production, integrate with Resend, SendGrid, or Power Automate
    const notification = {
      to: NOTIFICATION_EMAIL,
      subject: `RFQ Response Received: ${invite.rfq?.ref_number} — ${invite.vendor?.name}`,
      vendor: invite.vendor?.name,
      contact: `${invite.vendor?.contact_name} (${invite.vendor?.contact_email})`,
      rfq: `${invite.rfq?.ref_number}: ${invite.rfq?.title}`,
      site: invite.rfq?.site?.name || "All Sites",
      progress: `${totalSubmitted}/${totalInvited} responses received`,
      allComplete: totalSubmitted >= totalInvited,
    };

    console.log("📧 Notification:", JSON.stringify(notification, null, 2));

    return new Response(
      JSON.stringify({ success: true, ...notification }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
