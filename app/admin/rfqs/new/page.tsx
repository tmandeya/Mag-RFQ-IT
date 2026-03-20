'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import type { Site, Vendor } from '@/lib/types'

export default function CreateRFQPage() {
  const router = useRouter()
  const supabase = createClient()
  const [sites, setSites] = useState<Site[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [siteId, setSiteId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ description: '', quantity: '', unit: 'pcs', specs: '' }])
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: v }] = await Promise.all([
        supabase.from('sites').select('*').order('name'),
        supabase.from('vendors').select('*').eq('status', 'approved').order('name'),
      ])
      setSites(s || [])
      setVendors(v || [])
      if (s && s.length > 0) setSiteId(s[0].id)
      // Default expiry: 14 days from now
      const d = new Date()
      d.setDate(d.getDate() + 14)
      setExpiresAt(d.toISOString().split('T')[0])
      setLoading(false)
    }
    load()
  }, [])

  const addItem = () => setItems([...items, { description: '', quantity: '', unit: 'pcs', specs: '' }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: string, value: string) => {
    const updated = [...items]
    updated[idx] = { ...updated[idx], [field]: value }
    setItems(updated)
  }

  const toggleVendor = (id: string) => {
    setSelectedVendors(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  const validItems = items.filter(i => i.description.trim() && i.quantity)
  const canSubmit = title.trim() && siteId && validItems.length > 0 && selectedVendors.length > 0

  async function handleSave(send: boolean) {
    if (!canSubmit) return
    setSaving(true)

    try {
      // Create the RFQ
      const { data: rfq, error: rfqErr } = await supabase
        .from('rfqs')
        .insert({
          title,
          site_id: siteId,
          expires_at: expiresAt || null,
          notes: notes || null,
          status: send ? 'sent' : 'draft',
          ref_number: '', // trigger will auto-generate
        })
        .select()
        .single()

      if (rfqErr) throw rfqErr

      // Insert line items
      const itemInserts = validItems.map((item, idx) => ({
        rfq_id: rfq.id,
        sort_order: idx,
        description: item.description,
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit,
        specs: item.specs || null,
      }))

      const { error: itemsErr } = await supabase.from('rfq_items').insert(itemInserts)
      if (itemsErr) throw itemsErr

      // Create supplier invitations
      const supplierInserts = selectedVendors.map(vendorId => ({
        rfq_id: rfq.id,
        vendor_id: vendorId,
        expires_at: expiresAt ? new Date(expiresAt + 'T23:59:59Z').toISOString() : null,
        email_sent_at: send ? new Date().toISOString() : null,
      }))

      const { error: suppErr } = await supabase.from('rfq_suppliers').insert(supplierInserts)
      if (suppErr) throw suppErr

      router.push(`/admin/rfqs/${rfq.id}`)
    } catch (e: any) {
      alert('Error creating RFQ: ' + (e.message || 'Unknown error'))
    }
    setSaving(false)
  }

  const inp: React.CSSProperties = {
    padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)',
    background: '#fff', color: 'var(--text)', fontSize: 12,
    fontFamily: 'var(--font)', outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>Loading...</div>

  return (
    <div>
      <span onClick={() => router.push('/admin/rfqs')} style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>← Back to RFQs</span>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '10px 0 20px' }}>Create New RFQ</h1>

      {/* Header fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 4, fontWeight: 600 }}>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Underground Drilling Consumables — Q2" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 4, fontWeight: 600 }}>Site *</label>
          <select value={siteId} onChange={e => setSiteId(e.target.value)} style={inp}>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name} — {s.location}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 4, fontWeight: 600 }}>Deadline</label>
          <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={inp} />
        </div>
      </div>

      {/* Line Items */}
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Line Items *</span>
          <button onClick={addItem} style={{
            padding: '5px 14px', fontSize: 11, fontWeight: 700, background: 'var(--gold-bg)',
            color: 'var(--gold)', border: '1px solid var(--gold-border)', borderRadius: 8, cursor: 'pointer',
          }}>+ Add Item</button>
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 80px 70px 2fr 24px', gap: 8, marginBottom: 6 }}>
          {['Description *', 'Qty *', 'Unit', 'Specs / Requirements', ''].map(h => (
            <span key={h} style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{h}</span>
          ))}
        </div>

        {items.map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 80px 70px 2fr 24px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Item description" style={inp} />
            <input value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} placeholder="0" type="number" style={inp} />
            <select value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} style={inp}>
              {['pcs', 'kg', 'litres', 'metres', 'pairs', 'bags', 'drums', 'kits', 'sets', 'rolls', 'tonnes'].map(u => <option key={u}>{u}</option>)}
            </select>
            <input value={item.specs} onChange={e => updateItem(i, 'specs', e.target.value)} placeholder="Technical specs, brand, size..." style={inp} />
            {items.length > 1 && (
              <span onClick={() => removeItem(i)} style={{ color: 'var(--red)', cursor: 'pointer', fontSize: 16, textAlign: 'center' }}>×</span>
            )}
          </div>
        ))}
      </div>

      {/* Vendor Selection */}
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Select Suppliers *</span>
          <span style={{ fontSize: 11, color: selectedVendors.length > 0 ? 'var(--green)' : 'var(--text-dim)', fontWeight: 600 }}>
            {selectedVendors.length} selected
          </span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
          Each vendor receives a unique secure link to submit their quotation. You&apos;ll be notified when they respond.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {vendors.map(v => {
            const selected = selectedVendors.includes(v.id)
            return (
              <div
                key={v.id}
                onClick={() => toggleVendor(v.id)}
                style={{
                  padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
                  background: selected ? 'var(--gold-bg)' : 'transparent',
                  transition: 'all .15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: selected ? 'var(--gold-dark)' : 'var(--text)' }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {v.contact_name} · {v.contact_email}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>{v.category}</div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
                    background: selected ? 'var(--gold)' : 'transparent',
                    color: '#fff', fontSize: 12, fontWeight: 800,
                  }}>
                    {selected ? '✓' : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 4, fontWeight: 600 }}>Internal Notes (optional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any internal notes about this RFQ..." rows={3}
          style={{ ...inp, resize: 'vertical' }} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={() => handleSave(true)} disabled={!canSubmit || saving} style={{
          padding: '11px 24px', fontSize: 13, fontWeight: 700,
          background: canSubmit ? 'var(--sidebar)' : 'var(--border)',
          color: canSubmit ? '#fff' : 'var(--text-dim)',
          border: 'none', borderRadius: 8, cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}>
          {saving ? 'Creating...' : 'Create & Send to Suppliers →'}
        </button>
        <button onClick={() => handleSave(false)} disabled={!title.trim() || saving} style={{
          padding: '11px 24px', fontSize: 13, fontWeight: 700,
          background: '#fff', color: 'var(--text-sec)',
          border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer',
        }}>Save as Draft</button>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
          {validItems.length} item{validItems.length !== 1 ? 's' : ''} · {selectedVendors.length} vendor{selectedVendors.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
