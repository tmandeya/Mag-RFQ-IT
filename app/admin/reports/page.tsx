export default function ReportsPage() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Reports & Analytics</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>FY 2026 procurement analytics</p>
      <div style={{
        background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)',
        padding: 40, textAlign: 'center', color: 'var(--text-dim)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-sec)' }}>Reports coming soon</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Spend analytics, vendor performance, and site-level reporting will be available once RFQ data accumulates.</div>
      </div>
    </div>
  )
}
