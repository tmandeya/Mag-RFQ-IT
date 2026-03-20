'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ReactNode } from 'react'

const NAV = [
  { section: 'Main', items: [
    { icon: '◆', label: 'Dashboard', href: '/admin' },
    { icon: '📋', label: 'RFQs', href: '/admin/rfqs' },
    { icon: '📦', label: 'Purchase Orders', href: '/admin/purchase-orders' },
  ]},
  { section: 'Manage', items: [
    { icon: '🏭', label: 'Sites', href: '/admin/sites' },
    { icon: '🤝', label: 'Vendors', href: '/admin/vendors' },
  ]},
  { section: 'Insights', items: [
    { icon: '📊', label: 'Reports', href: '/admin/reports' },
  ]},
]

function SidebarItem({ icon, label, href, active }: { icon: string; label: string; href: string; active: boolean }) {
  const router = useRouter()
  return (
    <div
      onClick={() => router.push(href)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderRadius: 8,
        cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500,
        background: active ? 'rgba(184,134,11,0.15)' : 'transparent',
        color: active ? '#d4a843' : 'rgba(255,255,255,0.55)',
        transition: 'all .12s', marginBottom: 1,
      }}
    >
      <span style={{ fontSize: 15, width: 20, textAlign: 'center', opacity: active ? 1 : 0.5 }}>{icon}</span>
      {label}
    </div>
  )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{
        width: 224, background: 'var(--sidebar)', padding: '0 10px',
        display: 'flex', flexDirection: 'column', position: 'fixed',
        top: 0, bottom: 0, left: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{
          padding: '18px 10px 20px', display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 16,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6, background: '#d4a843',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 16, color: '#1c1c1c',
          }}>M</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Magaya Mining</div>
            <div style={{ fontSize: 9, color: '#d4a843', letterSpacing: '.08em', textTransform: 'uppercase' }}>Procurement</div>
          </div>
        </div>

        {/* Nav Groups */}
        <div style={{ flex: 1 }}>
          {NAV.map(group => (
            <div key={group.section}>
              <div style={{
                fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '.1em',
                textTransform: 'uppercase', padding: '0 16px', marginBottom: 6,
              }}>{group.section}</div>
              {group.items.map(item => {
                const active = item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href)
                return (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    active={active}
                  />
                )
              })}
              <div style={{ height: 14 }} />
            </div>
          ))}
        </div>

        {/* User */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: 'rgba(212,168,67,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#d4a843',
            }}>TM</div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Tayt Mandeya</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>IT Lead</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: 224, padding: '24px 28px', minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  )
}
