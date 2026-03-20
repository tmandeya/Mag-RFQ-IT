'use client'

import { useMemo, useState } from 'react'

interface Props {
  items: any[]
  suppliers: any[]
}

function computeComparison(items: any[], suppliers: any[]) {
  const vendors = suppliers.map(s => ({
    id: s.id,
    name: s.vendor?.name || 'Unknown',
    responses: s.rfq_responses || [],
  }))

  // Build price lookup: vendorIdx -> itemIdx -> price
  const priceMap: Record<string, Record<string, { price: number; lead: number; notes: string }>> = {}
  vendors.forEach(v => {
    priceMap[v.id] = {}
    v.responses.forEach((r: any) => {
      priceMap[v.id][r.rfq_item_id] = {
        price: Number(r.unit_price) || 0,
        lead: Number(r.lead_time_days) || 0,
        notes: r.notes || '',
      }
    })
  })

  // Best price per item
  const bestPerItem = items.map(item => {
    let best = Infinity, bestVId = ''
    vendors.forEach(v => {
      const p = priceMap[v.id]?.[item.id]?.price
      if (p && p < best) { best = p; bestVId = v.id }
    })
    return { price: best === Infinity ? 0 : best, vendorId: bestVId }
  })

  // Win count
  const winCount: Record<string, number> = {}
  vendors.forEach(v => winCount[v.id] = 0)
  bestPerItem.forEach(b => { if (b.vendorId) winCount[b.vendorId]++ })

  // Dominant vendor (≥70% wins)
  const dominant = vendors.find(v => winCount[v.id] / items.length >= 0.7)

  // Smart picks with consolidation
  const picks = items.map((item, idx) => {
    const cheapest = bestPerItem[idx]
    if (!dominant || cheapest.vendorId === dominant.id) {
      return { vendorId: cheapest.vendorId, price: cheapest.price, consolidated: false }
    }
    const domPrice = priceMap[dominant.id]?.[item.id]?.price
    if (domPrice && cheapest.price > 0 && (domPrice - cheapest.price) / cheapest.price <= 0.05) {
      return { vendorId: dominant.id, price: domPrice, consolidated: true }
    }
    return { vendorId: cheapest.vendorId, price: cheapest.price, consolidated: false }
  })

  // Split POs
  const splitPOs: Record<string, { vendorName: string; items: any[]; total: number }> = {}
  picks.forEach((pick, idx) => {
    const vendor = vendors.find(v => v.id === pick.vendorId)
    const key = pick.vendorId
    if (!splitPOs[key]) splitPOs[key] = { vendorName: vendor?.name || '', items: [], total: 0 }
    const lineTotal = pick.price * Number(items[idx].quantity)
    splitPOs[key].items.push({ ...items[idx], unitPrice: pick.price, lineTotal, consolidated: pick.consolidated })
    splitPOs[key].total += lineTotal
  })

  return { vendors, priceMap, bestPerItem, winCount, dominant, picks, splitPOs }
}

export default function ComparisonTable({ items, suppliers }: Props) {
  const [tab, setTab] = useState<'compare' | 'split'>('compare')
  const comp = useMemo(() => computeComparison(items, suppliers), [items, suppliers])

  return (
    <div>
      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[
          { k: 'compare' as const, l: 'Price Comparison' },
          { k: 'split' as const, l: 'Split Purchase Orders' },
        ].map(t => (
          <div key={t.k} onClick={() => setTab(t.k)} style={{
            padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
            fontWeight: tab === t.k ? 700 : 500,
            background: tab === t.k ? '#1c1c1c' : 'transparent',
            color: tab === t.k ? '#fff' : 'var(--text-muted)',
            border: `1px solid ${tab === t.k ? '#1c1c1c' : 'var(--border)'}`,
            transition: 'all .12s',
          }}>{t.l}</div>
        ))}
      </div>

      {/* COMPARISON TABLE */}
      {tab === 'compare' && (
        <div style={{
          background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)',
          overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Vendor Price Comparison</span>
            {comp.dominant && (
              <span style={{ fontSize: 11, color: 'var(--gold)', background: 'var(--gold-bg)', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
                ★ {comp.dominant.name} wins {comp.winCount[comp.dominant.id]}/{items.length} — consolidation ≤5%
              </span>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: '#fafaf8' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', minWidth: 180 }}>Item</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>QTY</th>
                  {comp.vendors.map(v => (
                    <th key={v.id} style={{
                      padding: '10px 14px', textAlign: 'right', fontSize: 10, minWidth: 120,
                      color: comp.dominant?.id === v.id ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 700,
                    }}>
                      {v.name.split(' ').slice(0, 2).join(' ')}{comp.dominant?.id === v.id ? ' ★' : ''}
                    </th>
                  ))}
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: 10, color: 'var(--green)', fontWeight: 700, minWidth: 110, background: 'var(--green-bg)' }}>PICK</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const pick = comp.picks[idx]
                  const best = comp.bestPerItem[idx]
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{item.description}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>{item.specs}</div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>{item.quantity}</td>
                      {comp.vendors.map(v => {
                        const data = comp.priceMap[v.id]?.[item.id]
                        const isBest = v.id === best.vendorId
                        return (
                          <td key={v.id} style={{ padding: '10px 14px', textAlign: 'right', background: isBest ? 'rgba(46,139,46,0.04)' : 'transparent' }}>
                            {data?.price ? (
                              <>
                                <div style={{ fontWeight: isBest ? 800 : 500, color: isBest ? 'var(--green)' : 'var(--text)' }}>
                                  ${data.price.toLocaleString('en', { minimumFractionDigits: 2 })}
                                  {isBest && <span style={{ fontSize: 8, marginLeft: 3, color: 'var(--green)', fontWeight: 800 }}>BEST</span>}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{data.lead}d lead</div>
                              </>
                            ) : (
                              <span style={{ color: 'var(--text-dim)' }}>—</span>
                            )}
                          </td>
                        )
                      })}
                      <td style={{ padding: '10px 14px', textAlign: 'right', background: 'var(--green-bg)' }}>
                        <div style={{ fontWeight: 700, color: pick.consolidated ? 'var(--gold)' : 'var(--green)' }}>
                          ${pick.price.toLocaleString('en', { minimumFractionDigits: 2 })}
                          {pick.consolidated && <span style={{ color: 'var(--gold)' }}> *</span>}
                        </div>
                        <div style={{ fontSize: 10, color: pick.consolidated ? 'var(--gold)' : 'var(--text-muted)' }}>
                          {comp.vendors.find(v => v.id === pick.vendorId)?.name.split(' ')[0]}
                          {pick.consolidated ? ' (consol.)' : ''}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {/* Totals */}
                <tr style={{ background: 'var(--gold-bg)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--gold)' }}>TOTAL</td>
                  <td />
                  {comp.vendors.map(v => {
                    const t = items.reduce((s, item) => s + (comp.priceMap[v.id]?.[item.id]?.price || 0) * Number(item.quantity), 0)
                    return <td key={v.id} style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text-sec)' }}>${t.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  })}
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--green)', fontSize: 14, background: 'var(--green-bg)' }}>
                    ${Object.values(comp.splitPOs).reduce((s, po) => s + po.total, 0).toLocaleString('en', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {comp.dominant && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>*</span> Consolidated to {comp.dominant.name} — within 5% variance, reducing split orders and admin overhead.
            </div>
          )}
        </div>
      )}

      {/* SPLIT POs */}
      {tab === 'split' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Optimised into {Object.keys(comp.splitPOs).length} purchase order{Object.keys(comp.splitPOs).length > 1 ? 's' : ''}:
          </p>
          {Object.entries(comp.splitPOs).map(([vendorId, po]) => (
            <div key={vendorId} style={{
              background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)',
              overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 14,
            }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{po.vendorName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{po.items.length} items</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)' }}>
                    USD {po.total.toLocaleString('en', { minimumFractionDigits: 2 })}
                  </div>
                  <button style={{
                    marginTop: 6, padding: '5px 14px', fontSize: 11, fontWeight: 700,
                    background: 'var(--gold-bg)', color: 'var(--gold)',
                    border: '1px solid var(--gold-border)', borderRadius: 8, cursor: 'pointer',
                  }}>Generate PO →</button>
                </div>
              </div>
              <table style={{ width: '100%', fontSize: 12 }}>
                <tbody>
                  {po.items.map((item: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '9px 20px', fontWeight: 600 }}>{item.description}</td>
                      <td style={{ padding: '9px 14px', color: 'var(--text-muted)' }}>{item.quantity} {item.unit}</td>
                      <td style={{ padding: '9px 14px' }}>${item.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '9px 14px', fontWeight: 700 }}>${item.lineTotal.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '9px 14px' }}>
                        {item.consolidated && (
                          <span style={{ fontSize: 10, color: 'var(--gold)', background: 'var(--gold-bg)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>★ Consolidated</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
