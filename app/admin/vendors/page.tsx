import { createClient } from '@/lib/supabase-server'

export default async function VendorsPage() {
  const supabase = await createClient()
  const { data: vendors } = await supabase
    .from('vendors')
    .select('*, vendor_documents(*)')
    .order('name')

  const statusColors: Record<string, { bg: string; fg: string }> = {
    approved: { bg: 'var(--green-bg)', fg: 'var(--green)' },
    pending: { bg: 'var(--gold-bg)', fg: 'var(--gold)' },
    suspended: { bg: 'var(--red-bg)', fg: 'var(--red)' },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Vendor Management</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{vendors?.length || 0} registered vendors</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: vendors?.length || 0, color: 'var(--blue)' },
          { label: 'Approved', value: vendors?.filter(v => v.status === 'approved').length || 0, color: 'var(--green)' },
          { label: 'Pending', value: vendors?.filter(v => v.status === 'pending').length || 0, color: 'var(--gold)' },
          { label: 'Total Spend', value: `$${((vendors?.reduce((s, v) => s + Number(v.total_spend || 0), 0) || 0) / 1000).toFixed(0)}k`, color: 'var(--purple)' },
        ].map(stat => (
          <div key={stat.label} style={{ flex: 1, minWidth: 140, background: 'var(--card)', borderRadius: 12, padding: '18px 20px', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: '#fafaf8' }}>
              {['Vendor', 'Category', 'Contact', 'Status', 'Total Spend', 'POs', 'Docs', 'Rating'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vendors?.map(v => {
              const sc = statusColors[v.status] || statusColors.pending
              const docs = (v.vendor_documents || []) as any[]
              return (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>{v.name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 11 }}>{v.category || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 12 }}>{v.contact_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{v.contact_role}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{v.contact_email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: sc.bg, color: sc.fg, textTransform: 'capitalize' }}>{v.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                    {Number(v.total_spend) > 0 ? `$${Number(v.total_spend).toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{v.po_count}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {docs.length > 0 ? (
                      <span style={{ fontSize: 10, color: 'var(--blue)', background: 'var(--blue-bg)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                        📄 {docs.length}
                      </span>
                    ) : <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>None</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {Number(v.rating) > 0 ? (
                      <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>★ {v.rating}</span>
                    ) : <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
