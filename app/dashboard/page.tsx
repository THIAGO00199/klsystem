'use client'
import { useAuth } from '@/app/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const atalhos = [
  { icon: '👥', label: 'Profissionais', href: '/dashboard/profissionais' },
  { icon: '🔧', label: 'Serviços', href: '/dashboard/servicos' },
  { icon: '⏰', label: 'Horários', href: '/dashboard/horarios' },
  { icon: '📅', label: 'Agendamentos', href: '/dashboard/agendamentos' },
  { icon: '🎨', label: 'Personalizar', href: '/dashboard/personalizar' },
  { icon: '⚙️', label: 'Configurações', href: '/dashboard/configuracoes' },
]

export default function DashboardPage() {
  const { empresa, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !empresa) {
      router.push('/auth')
    }
  }, [loading, empresa])

  if (loading) {
    return (
      <div style={{ background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#fff' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
          Olá, {empresa?.nome}! 👋
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
          Bem-vindo ao seu painel de controle
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 8px' }}>Agendamentos hoje</p>
          <p style={{ color: '#00e5a0', fontSize: 32, fontWeight: 700, margin: 0 }}>0</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 8px' }}>Profissionais</p>
          <p style={{ color: '#5b8dff', fontSize: 32, fontWeight: 700, margin: 0 }}>0</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 8px' }}>Serviços</p>
          <p style={{ color: '#a855f7', fontSize: 32, fontWeight: 700, margin: 0 }}>0</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 8px' }}>Clientes</p>
          <p style={{ color: '#f97316', fontSize: 32, fontWeight: 700, margin: 0 }}>0</p>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>Acesso rápido</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {atalhos.map(item => (
            <a
              key={item.href}
              href={item.href}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{item.label}</span>
            </a>
          ))}
        </div>
      </div>

      {empresa?.slug && (
        <div style={{ background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.15)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ color: '#00e5a0', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>Seu site público</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>localhost:3000/{empresa.slug}</p>
          </div>
          <a href={`/${empresa.slug}`} target="_blank" style={{ padding: '8px 20px', background: '#00e5a0', color: '#000', fontWeight: 600, fontSize: 13, borderRadius: 8, textDecoration: 'none' }}>
            Ver site →
          </a>
        </div>
      )}

    </div>
  )
}