'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createSupplierClient } from '@/lib/supabase-browser'

export default function SupplierPortal() {
  const params = useParams()
  const token = params.token as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rfq, setRfq] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [invite, setInvite] = useState<any>(null)
  const [responses, setResponses] = useState<Record<string, { price: string; lead: string; notes: string }>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadRfq()
  }, [token])

  async function loadRfq() {
    try {
      const supabase = createSupplierClient(token)

      // Get the supplier invitation
      const { data: inviteData, error: inviteErr } = await supabase
        .from('rfq_suppliers')
        .select('*')
        .single()

      if (inviteErr || !inviteData) {
        setError('This RFQ link is invalid or has expired.')
        setLoading(false)
        return
      }

      setInvite(inviteData)

      if (inviteData.submitted_at) {
        setSubmitted(true)
      }

      // Check expiry
      if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
        setError('This RFQ has expired and is no longer accepting submissions.')
        setLoading(false)
        return
      }

      // Get RFQ details
      const { data: rfqData } = await supabase
        .from('rfqs')
        .select('*')
        .single()

      setRfq(rfqData)

      // Get line items
      const { data: itemsData } = await supabase
        .from('rfq_items')
        .select('*')
        .order('sort_order')

      setItems(itemsData || [])

      // Init response state
      const initial: Record<string, { price: string; lead: string; notes: string }> = {}
      itemsData?.forEach(item => {
        initial[item.id] = { price: '', lead: '', notes: '' }
      })
      setResponses(initial)

      // Mark as viewed
      if (!inviteData.viewed_at) {
        await supabase
          .from('rfq_suppliers')
          .update({ viewed_at: new Date().toISOString() })
          .eq('id', inviteData.id)
      }
    } catch (e) {
      setError('Something went wrong loading this RFQ.')
    }
    setLoading(false)
  }

  async function handleSubmit() {
    if (!invite || submitting) return
    setSubmitting(true)

    try {
      const supabase = createSupplierClient(token)

      // Upsert all responses
      const upserts = items.map(item => ({
        rfq_supplier_id: invite.id,
        rfq_item_id: item.id,
        unit_price: parseFloat(responses[item.id]?.price) || null,
        lead_time_days: parseInt(responses[item.id]?.lead) || null,
        notes: responses[item.id]?.notes || null,
        currency: 'USD',
      }))

      const { error: respErr } = await supabase
        .from('rfq_responses')
        .upsert(upserts, { onConflict: 'rfq_supplier_id,rfq_item_id' })

      if (respErr) throw respErr

      // Mark as submitted
      await supabase
        .from('rfq_suppliers')
        .update({ submitted_at: new Date().toISOString() })
        .eq('id', invite.id)

      setSubmitted(true)
    } catch (e) {
      alert('Failed to submit. Please try again.')
    }
    setSubmitting(false)
  }

  const update = (id: string, field: string, value: string) => {
    setResponses(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const allFilled = items.every(i => responses[i.id]?.price && responses[i.id]?.lead)
  const total = items.reduce((sum, i) => sum + (parseFloat(responses[i.id]?.price) || 0) * i.quantity, 0)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0e0e0e', color: '#888' }}>
      Loading RFQ...
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0e0e0e', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <div style={{ color: '#c94040', fontSize: 16, fontWeight: 700 }}>{error}</div>
      <div style={{ color: '#666', fontSize: 13 }}>Contact procurement@magayamining.co.zw for assistance.</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f1' }}>
      {/* Header */}
      <div style={{ background: '#1c1c1c', padding: '24px 0', textAlign: 'center', borderBottom: '1px solid #333' }}>
        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#d4a843', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#1c1c1c', marginBottom: 8 }}>M</div>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Magaya Mining (Pvt) Ltd</div>
        <div style={{ color: '#d4a843', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 4 }}>Request for Quotation</div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 60px', fontFamily: "'DM Sans', sans-serif" }}>
        {/* RFQ Info */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e5e3de' }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#b0b0b0' }}>{rfq?.ref_number}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{rfq?.title}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#b0b0b0', textTransform: 'uppercase' }}>Deadline</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{rfq?.expires_at || 'Open'}</div>
          </div>
        </div>

        {submitted ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: '40px 24px', textAlign: 'center', border: '1px solid #e5e3de' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26, color: 'var(--green)' }}>✓</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Quotation Submitted</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
              Your response to <strong>{rfq?.ref_number}</strong> has been received by Magaya Mining&apos;s procurement team.
            </div>
            <div style={{ marginTop: 20, fontSize: 22, fontWeight: 800, color: 'var(--gold)' }}>
              USD {total.toLocaleString('en', { minimumFractionDigits: 2 })}
            </div>
          </div>
        ) : (
          <>
            <div style={{ background: 'var(--blue-bg)', border: '1px solid rgba(58,123,213,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 18, fontSize: 12, color: 'var(--blue)', lineHeight: 1.6 }}>
              Please provide your <strong>unit price</strong>, <strong>lead time</strong>, and any notes per item. Fields marked * are required.
            </div>

            {items.map((item, idx) => {
              const r = responses[item.id]
              const filled = r?.price && r?.lead
              return (
                <div key={item.id} style={{
                  background: '#fff', borderRadius: 12, padding: '16px 18px', marginBottom: 12,
                  borderLeft: `3px solid ${filled ? 'var(--green)' : 'var(--border)'}`,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)', marginRight: 6 }}>#{idx + 1}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{item.description}</span>
                    </div>
                    {filled && <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 3, background: 'var(--green-bg)', color: 'var(--green)', fontWeight: 700 }}>COMPLETE</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>{item.specs}</div>
                  <div style={{ display: 'inline-flex', gap: 6, padding: '4px 10px', background: '#fafaf8', borderRadius: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Qty: {item.quantity} {item.unit}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 3 }}>Unit Price (USD) *</label>
                      <input type="number" step="0.01" placeholder="0.00" value={r?.price || ''} onChange={e => update(item.id, 'price', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 3 }}>Lead Time (days) *</label>
                      <input type="number" placeholder="0" value={r?.lead || ''} onChange={e => update(item.id, 'lead', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 3 }}>Notes</label>
                      <input placeholder="Availability, conditions..." value={r?.notes || ''} onChange={e => update(item.id, 'notes', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  {r?.price && (
                    <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
                      Line total: <strong style={{ color: 'var(--text)' }}>USD {(parseFloat(r.price) * item.quantity).toLocaleString('en', { minimumFractionDigits: 2 })}</strong>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Submit */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Quoted Total</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold)' }}>USD {total.toLocaleString('en', { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ fontSize: 11, color: allFilled ? 'var(--green)' : 'var(--gold)', fontWeight: 600 }}>
                  {items.filter(i => responses[i.id]?.price && responses[i.id]?.lead).length} / {items.length} items
                </div>
              </div>
              <button onClick={handleSubmit} disabled={!allFilled || submitting} style={{
                width: '100%', padding: 13, fontSize: 14, fontWeight: 700,
                background: allFilled ? 'var(--sidebar)' : 'var(--border)',
                color: allFilled ? '#fff' : 'var(--text-dim)',
                border: 'none', borderRadius: 8,
                cursor: allFilled ? 'pointer' : 'not-allowed',
              }}>
                {submitting ? 'Submitting...' : allFilled ? 'Submit Quotation' : 'Complete all required fields'}
              </button>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}>
                Prices valid for 30 days from submission
              </div>
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 10, color: 'var(--text-dim)' }}>
          Magaya Mining (Pvt) Ltd · Harare, Zimbabwe · Secure RFQ Portal
        </div>
      </div>
    </div>
  )
}
