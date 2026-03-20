import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function RFQsPage() {
  const supabase = await createClient()

  const { data: rfqs } = await supabase
    .from('rfqs')
    .select(`
      *,
      site:sites(name, code),
      rfq_suppliers(id, vendor_id, submitted_at, vendor:vendors(name))
    `)
    .order('created_at', { ascending: false })

  const statusConfig: Record<string, { label: string; bg: string; fg: string }> = {
    draft: { label: 'Draft', bg: '#f3f3f3', fg: '#888' },
    sent: { label: 'Sent', bg: '#eef4fc', fg: '#3a7bd5' },
    partial: { label: 'Partial', bg: '#fdf6e8', fg: '#b8860b' },
    complete: { label: 'All Responded', bg: '#edf7ed', fg: '#2e8b2e' },
    awarded: { label: 'Awarded', bg: '#f3eefa', fg: '#7b4fc9' },
    closed: { label: 'Closed', bg: '#fceaea', fg: '#c94040' },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Requests for Quotation</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {rfqs?.length || 0} total
          </p>
        </div>
        <Link href="/admin/rfqs/new" style={{
          padding: '9px 18px', fontSize: 12, fontWeight: 700, background: 'var(--sidebar)',
          color: '#fff', border: '1px solid var(--sidebar)', borderRadius: 8,
          textDecoration: 'none',
        }}>+ New RFQ</Link>
      </div>

      <div style={{
        background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)',
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <table style={{ width: '100%', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: '#fafaf8' }}>
              {['Ref', 'Title', 'Site', 'Suppliers', 'Status', 'Expires', ''].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: 'left', fontSize: 10,
                  color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '.06em',
                  textTransform: 'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rfqs?.map(rfq => {
              const suppliers = (rfq.rfq_suppliers || []) as any[]
              const sc = statusConfig[rfq.status] || statusConfig.draft
              return (
                <tr key={rfq.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <Link href={`/admin/rfqs/${rfq.id}`} style={{
                      fontFamily: 'var(--mono)', color: 'var(--gold)', fontSize: 11, fontWeight: 600,
                    }}>{rfq.ref_number}</Link>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    <Link href={`/admin/rfqs/${rfq.id}`}>{rfq.title}</Link>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                    {(rfq.site as any)?.name || 'All Sites'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {suppliers.map((s: any) => (
                        <span key={s.id} style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 600,
                          background: s.submitted_at ? 'var(--green-bg)' : 'var(--blue-bg)',
                          color: s.submitted_at ? 'var(--green)' : 'var(--blue)',
                        }}>
                          {s.vendor?.name?.split(' ')[0]}{s.submitted_at ? ' ✓' : ''}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: sc.bg, color: sc.fg,
                    }}>{sc.label}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 11 }}>
                    {rfq.expires_at || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-dim)' }}>→</td>
                </tr>
              )
            })}
            {(!rfqs || rfqs.length === 0) && (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
                  No RFQs yet. Create your first one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
