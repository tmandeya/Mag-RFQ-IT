import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ComparisonTable from './comparison'

export default async function RFQDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: rfq } = await supabase
    .from('rfqs')
    .select(`
      *,
      site:sites(name, code, location),
      rfq_items(*, rfq_responses:rfq_responses(*)),
      rfq_suppliers(
        *,
        vendor:vendors(id, name, contact_name, contact_email),
        rfq_responses(*),
        rfq_attachments(*)
      )
    `)
    .eq('id', id)
    .single()

  if (!rfq) return notFound()

  const suppliers = (rfq.rfq_suppliers || []) as any[]
  const items = (rfq.rfq_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order) as any[]
  const respondedSuppliers = suppliers.filter((s: any) => s.submitted_at)
  const hasMultipleResponses = respondedSuppliers.length >= 2

  const statusConfig: Record<string, { label: string; bg: string; fg: string }> = {
    draft: { label: 'Draft', bg: '#f3f3f3', fg: '#888' },
    sent: { label: 'Sent', bg: '#eef4fc', fg: '#3a7bd5' },
    partial: { label: 'Partial Response', bg: '#fdf6e8', fg: '#b8860b' },
    complete: { label: 'All Responded', bg: '#edf7ed', fg: '#2e8b2e' },
    awarded: { label: 'Awarded', bg: '#f3eefa', fg: '#7b4fc9' },
    closed: { label: 'Closed', bg: '#fceaea', fg: '#c94040' },
  }
  const sc = statusConfig[rfq.status] || statusConfig.draft

  // Build supplier link base
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Link href="/admin/rfqs" style={{ color: 'var(--text-muted)', fontSize: 13 }}>← RFQs</Link>
        <span style={{ color: 'var(--text-dim)' }}>·</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--gold)' }}>{rfq.ref_number}</span>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>{rfq.title}</h1>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.fg }}>{sc.label}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {(rfq.site as any)?.name || 'All Sites'} · Expires {rfq.expires_at || 'N/A'} · {suppliers.length} invited · {respondedSuppliers.length} responded
        </span>
      </div>

      {/* Comparison Table (client component) */}
      {hasMultipleResponses && (
        <ComparisonTable items={items} suppliers={respondedSuppliers} />
      )}

      {/* Supplier Links / Status */}
      <div style={{
        background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)',
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        marginTop: hasMultipleResponses ? 20 : 0,
      }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Suppliers ({suppliers.length})</span>
        </div>
        {suppliers.map((s: any) => (
          <div key={s.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.vendor?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {s.vendor?.contact_name} · {s.vendor?.contact_email}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--mono)', marginTop: 4 }}>
                Link: {baseUrl}/supplier/{s.token}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {s.submitted_at ? (
                <>
                  <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                    ✓ Submitted {new Date(s.submitted_at).toLocaleDateString()}
                  </span>
                  {(s.rfq_attachments || []).length > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 10 }}>
                      📎 {s.rfq_attachments.length}
                    </span>
                  )}
                </>
              ) : s.viewed_at ? (
                <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>Viewed {new Date(s.viewed_at).toLocaleDateString()}</span>
              ) : s.email_sent_at ? (
                <span style={{ fontSize: 11, color: 'var(--blue)' }}>Sent {new Date(s.email_sent_at).toLocaleDateString()}</span>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Not sent</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Line Items */}
      <div style={{
        background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)',
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginTop: 20,
      }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Line Items ({items.length})</span>
        </div>
        {items.map((item: any, idx: number) => (
          <div key={item.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                <span style={{ color: 'var(--text-dim)', marginRight: 6 }}>#{idx + 1}</span>
                {item.description}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{item.specs}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {item.quantity} {item.unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
