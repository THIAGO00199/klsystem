'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ background: '#0a0a0f', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div style={{ fontSize: 20, fontWeight: 700, background: 'linear-gradient(135deg, #00e5a0, #5b8dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KL System</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="#planos" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Planos</a>
          <Link href="/auth" style={{ padding: '8px 20px', background: '#00e5a0', color: '#000', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>Entrar</Link>
        </div>
      </nav>

      <section style={{ padding: '80px 40px', textAlign: 'center', background: 'linear-gradient(135deg, #0a0a0f 0%, #111127 50%, #0a0a0f 100%)' }}>
        <h1 style={{ fontSize: 56, fontWeight: 700, margin: '0 0 16px', background: 'linear-gradient(135deg, #00e5a0, #5b8dff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Seu agendamento online em minutos
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', margin: '0 0 32px' }}>
          Barbearias, clínicas, salões. Customizável. Automático. Profissional.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Link href="/auth" style={{ padding: '16px 48px', background: '#00e5a0', color: '#000', fontWeight: 700, fontSize: 17, borderRadius: 12, textDecoration: 'none' }}>Começar Grátis →</Link>
          <Link href="/barbearia-demo" style={{ padding: '16px 48px', background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 700, fontSize: 17, borderRadius: 12, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>Ver Demo</Link>
        </div>
      </section>

      <section id="planos" style={{ padding: '80px 40px', background: '#111118', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, textAlign: 'center', marginBottom: 60 }}>Planos</h2>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          
          <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>BASIC</div>
            <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 32 }}>R$97,60<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>/mês</span></div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
              <li style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14 }}>✓ Até 2 profissionais</li>
              <li style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14 }}>✓ Até 100 agendamentos</li>
              <li style={{ padding: '10px 0', fontSize: 14 }}>✓ Site público</li>
            </ul>
            <Link href="/auth" style={{ display: 'block', padding: '12px 24px', background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 600, borderRadius: 10, textDecoration: 'none', textAlign: 'center' }}>Começar</Link>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #0a0a0f, rgba(91,141,255,0.05))', border: '1px solid rgba(91,141,255,0.4)', borderRadius: 16, padding: 32, transform: 'scale(1.05)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5b8dff', textTransform: 'uppercase', marginBottom: 12 }}>⭐ MAIS POPULAR</div>
            <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 32 }}>R$197,44<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>/mês</span></div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
              <li style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14 }}>✓ Ilimitado tudo</li>
              <li style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14 }}>✓ Editor DIY</li>
              <li style={{ padding: '10px 0', fontSize: 14 }}>✓ Customizável</li>
            </ul>
            <Link href="/auth" style={{ display: 'block', padding: '12px 24px', background: '#5b8dff', color: '#000', fontWeight: 700, borderRadius: 10, textDecoration: 'none', textAlign: 'center' }}>Começar Agora →</Link>
          </div>

          <div style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>PREMIUM</div>
            <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 32 }}>R$405,70<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>/mês</span></div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
              <li style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14 }}>✓ Tudo do Pro</li>
              <li style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14 }}>✓ IA integrada</li>
              <li style={{ padding: '10px 0', fontSize: 14 }}>✓ WhatsApp bot</li>
            </ul>
            <Link href="/auth" style={{ display: 'block', padding: '12px 24px', background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 600, borderRadius: 10, textDecoration: 'none', textAlign: 'center' }}>Começar</Link>
          </div>

        </div>
      </section>

      <footer style={{ padding: '40px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
        <p>© 2026 KL System. Feito com ❤️ para crescer negócios online.</p>
      </footer>
    </div>
  )
}