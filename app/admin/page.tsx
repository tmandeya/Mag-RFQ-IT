import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { data: rfqs },
    { data: pos },
    { data: sites },
    { data: vendors },
  ] = await Promise.all([
    supabase.from('rfqs').select('*, site:sites(name, code)').order('created_at', { ascending: false }).limit(5),
    supabase.from('purchase_orders').select('*'),
    supabase.from('sites').select('*'),
    supabase.from('vendors').select('*'),
  ])

  const activeRfqs = rfqs?.filter(r => ['sent', 'partial', 'complete'].includes(r.status)).length || 0
  const awaitingResponse = rfqs?.filter(r => r.status === 'sent').length || 0
  const pendingPOs = pos?.filter(p => ['ordered', 'delivered', 'invoiced'].includes(p.stage)).length || 0

  const statusColors: Record<string, { bg: string; fg: string }> = {
    draft: { bg: '#f3f3f3', fg: '#888' },
    sent: { bg: '#eef4fc', fg: '#3a7bd5' },
    partial: { bg: '#fdf6e8', fg: '#b8860b' },
    complete: { bg: '#edf7ed', fg: '#2e8b2e' },
    awarded: { bg: '#f3eefa', fg: '#7b4fc9' },
    closed: { bg: '#fceaea', fg: '#c94040' },
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Procurement overview — {sites?.length || 0} sites, {vendors?.length || 0} vendors
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Active RFQs', value: activeRfqs, color: 'var(--blue)' },
          { label: 'Awaiting Response', value: awaitingResponse, color: 'var(--gold)' },
          { label: 'Pending POs', value: pendingPOs, color: '#d48a0b' },
          { label: 'Total Sites', value: sites?.length || 0, color: 'var(--green)' },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1, minWidth: 140, background: 'var(--card)', borderRadius: 12,
            padding: '18px 20px', border: '1px solid var(--border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent RFQs */}
      <div style={{
        background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)',
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Recent RFQs</span>
          <Link href="/admin/rfqs" style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>View All →</Link>
        </div>
        {rfqs?.map(rfq => (
          <Link key={rfq.id} href={`/admin/rfqs/${rfq.id}`} style={{ display: 'block' }}>
            <div style={{
              padding: '12px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'background .12s', cursor: 'pointer',
            }}>
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>{rfq.ref_number}</span>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{rfq.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  {(rfq.site as any)?.name || 'All Sites'}
                </div>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: statusColors[rfq.status]?.bg || '#f3f3f3',
                color: statusColors[rfq.status]?.fg || '#888',
              }}>{rfq.status}</span>
            </div>
          </Link>
        ))}
        {(!rfqs || rfqs.length === 0) && (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-dim)' }}>
            No RFQs yet. <Link href="/admin/rfqs/new" style={{ color: 'var(--gold)', fontWeight: 600 }}>Create your first →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
