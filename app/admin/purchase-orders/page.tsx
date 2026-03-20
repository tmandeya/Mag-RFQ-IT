import { createClient } from '@/lib/supabase-server'

export default async function PurchaseOrdersPage() {
  const supabase = await createClient()
  const { data: pos } = await supabase
    .from('purchase_orders')
    .select('*, vendor:vendors(name), site:sites(name, code), rfq:rfqs(ref_number)')
    .order('created_at', { ascending: false })

  const stageConfig: Record<string, { label: string; color: string; icon: string }> = {
    ordered: { label: 'Ordered', color: '#3a7bd5', icon: '📋' },
    delivered: { label: 'Delivered', color: '#2e8b2e', icon: '🚛' },
    invoiced: { label: 'Invoiced', color: '#b8860b', icon: '📄' },
    paid: { label: 'Paid', color: '#7b4fc9', icon: '✓' },
  }
  const stages = Object.keys(stageConfig)

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Purchase Orders</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>Track delivery, invoicing, and payment</p>

      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        {stages.map(s => {
          const count = pos?.filter(p => p.stage === s).length || 0
          const st = stageConfig[s]
          return (
            <div key={s} style={{ flex: 1, background: 'var(--card)', borderRadius: 12, padding: '16px 18px', border: '1px solid var(--border)', borderTop: `3px solid ${st.color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: st.color }}>{count}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{st.icon} {st.label}</div>
            </div>
          )
        })}
      </div>

      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: '#fafaf8' }}>
              {['PO #', 'RFQ', 'Vendor', 'Site', 'Total', 'Stage', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pos?.map(po => {
              const st = stageConfig[po.stage] || stageConfig.ordered
              return (
                <tr key={po.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', color: 'var(--gold)', fontSize: 11, fontWeight: 600 }}>{po.po_number}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontSize: 11 }}>{(po.rfq as any)?.ref_number || '—'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{(po.vendor as any)?.name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{(po.site as any)?.name || '—'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>${Number(po.total).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${st.color}12`, color: st.color }}>{st.icon} {st.label}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {stages.map((s, i) => (
                        <div key={s} style={{ width: 8, height: 8, borderRadius: '50%', background: stages.indexOf(po.stage) >= i ? stageConfig[s].color : 'var(--border)' }} />
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
            {(!pos || pos.length === 0) && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>No purchase orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
