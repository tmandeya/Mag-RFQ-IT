import { createClient } from '@/lib/supabase-server'

export default async function SitesPage() {
  const supabase = await createClient()
  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .order('code')

  const typeColors: Record<string, { bg: string; fg: string }> = {
    office: { bg: 'var(--blue-bg)', fg: 'var(--blue)' },
    underground: { bg: 'var(--gold-bg)', fg: 'var(--gold)' },
    open_pit: { bg: 'var(--green-bg)', fg: 'var(--green)' },
    processing: { bg: 'var(--purple-bg)', fg: 'var(--purple)' },
  }

  const typeLabels: Record<string, string> = {
    office: 'Office', underground: 'Underground', open_pit: 'Open Pit', processing: 'Processing',
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Site Management</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{sites?.length || 0} sites</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Sites', value: sites?.length || 0, color: 'var(--blue)' },
          { label: 'Underground', value: sites?.filter(s => s.type === 'underground').length || 0, color: 'var(--gold)' },
          { label: 'Open Pit', value: sites?.filter(s => s.type === 'open_pit').length || 0, color: 'var(--green)' },
          { label: 'Total Headcount', value: sites?.reduce((s, d) => s + (d.employee_count || 0), 0).toLocaleString() || '0', color: 'var(--purple)' },
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
              {['Code', 'Site Name', 'Location', 'Type', 'Administrator', 'Email', 'Phone', 'Staff'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sites?.map(site => {
              const tc = typeColors[site.type] || typeColors.office
              return (
                <tr key={site.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--gold)', background: 'var(--gold-bg)', padding: '2px 8px', borderRadius: 4 }}>{site.code}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{site.name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{site.location}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: tc.bg, color: tc.fg }}>{typeLabels[site.type]}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-sec)' }}>{site.admin_name || '—'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 11 }}>{site.admin_email || '—'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 11 }}>{site.admin_phone || '—'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{site.employee_count}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
