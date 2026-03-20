# Mag-RFQ-IT

**Magaya Mining (Pvt) Ltd — Procurement RFQ Platform**

Internal platform for managing Requests for Quotation across all 11 Magaya Mining sites.

## Stack

- **Frontend**: Next.js 15 (App Router, Server Components)
- **Database**: Supabase (PostgreSQL + Row Level Security)
- **Hosting**: Vercel
- **Auth**: Supabase Auth (admin) + Token-based access (suppliers)

## Features

- **RFQ Management** — Create, send, and track RFQs across multiple suppliers
- **Supplier Portal** — Secure token-based links for suppliers to submit pricing
- **Price Comparison** — Side-by-side vendor comparison with smart picking algorithm
- **Split Purchase Orders** — Auto-generated POs split by vendor with consolidation logic
- **Site Management** — Manage all 11 mine sites with admin contacts
- **Vendor Management** — Vendor registry with documents, contacts, and quote history
- **PO Tracking** — Ordered → Delivered → Invoiced → Paid pipeline
- **Reports** — Spend analytics by site, vendor, and time period

## Architecture

```
/app
  /admin          → Protected admin dashboard (Supabase Auth)
    /rfqs         → RFQ list, detail, comparison
    /vendors      → Vendor registry + documents
    /sites        → Site management
    /purchase-orders → PO tracking
    /reports      → Analytics
  /supplier/[token] → Public supplier RFQ form (token auth via RLS)
/lib
  supabase-browser.ts  → Client-side Supabase client
  supabase-server.ts   → Server-side Supabase client
  types.ts             → TypeScript type definitions
```

## Security Model

- Admin routes protected by Supabase Auth middleware
- Supplier access via UUID tokens embedded in URLs
- Row Level Security ensures suppliers can only access their own RFQ
- Tokens expire after the RFQ deadline
- Forms lock after submission

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://sqghpsflohvmyejqohrk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NOTIFICATION_EMAIL=it@magayamining.co.zw
```

## Getting Started

```bash
npm install
npm run dev
```

## Database

Supabase project: **Mag-RFQ-IT** (EU West)

Tables: `sites`, `vendors`, `vendor_documents`, `rfqs`, `rfq_items`, `rfq_suppliers`, `rfq_responses`, `rfq_attachments`, `purchase_orders`, `po_items`
