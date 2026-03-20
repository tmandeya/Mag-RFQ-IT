'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f4f1', fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: 380, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10, background: '#b8860b',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 22, color: '#fff', marginBottom: 12,
          }}>M</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>Magaya Mining</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Procurement RFQ Portal</p>
        </div>

        <form onSubmit={handleLogin} style={{
          background: '#fff', borderRadius: 12, border: '1px solid #e5e3de',
          padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 4, fontWeight: 600 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tayt@magayamining.co.zw" required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e3de', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 4, fontWeight: 600 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e3de', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {error && (
            <div style={{ background: 'rgba(201,64,64,0.07)', border: '1px solid rgba(201,64,64,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#c94040' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 12, fontSize: 14, fontWeight: 700,
            background: '#1c1c1c', color: '#fff', border: 'none', borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 10, color: '#b0b0b0', marginTop: 20 }}>
          Magaya Mining (Pvt) Ltd · Secure Portal
        </p>
      </div>
    </div>
  )
}
