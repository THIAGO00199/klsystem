'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    empresaNome: '',
    empresaSegmento: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` }
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('Erro ao criar usuário')

      const slug = formData.empresaNome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      
      const { error: empresaError } = await supabase.from('empresas').insert({
        nome: formData.empresaNome,
        slug: slug,
        segmento: formData.empresaSegmento,
        email: formData.email,
        plano_id: 'aaaaaaaa-0000-0000-0000-000000000002',
        trial_ate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
      if (empresaError) throw empresaError

      const { data: empresas } = await supabase.from('empresas').select('id').eq('email', formData.email).single()
      if (empresas) {
        await supabase.from('personalizacao').insert({ empresa_id: empresas.id })
      }

      alert('Cadastro realizado! Faça login agora.')
      setFormData({ email: '', password: '', empresaNome: '', empresaSegmento: '' })
      setIsLogin(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })
      if (error) throw error
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '40px', maxWidth: '420px', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 8px' }}>KL System</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
            {isLogin ? 'Faça login na sua conta' : 'Crie sua conta agora'}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={isLogin ? handleSignIn : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" required
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>Senha</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {!isLogin && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>Nome da Empresa</label>
                <input type="text" name="empresaNome" value={formData.empresaNome} onChange={handleChange} placeholder="Barbearia João" required
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>Segmento</label>
                <select name="empresaSegmento" value={formData.empresaSegmento} onChange={handleChange} required
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">Escolha um segmento</option>
                  <option value="barbearia">Barbearia</option>
                  <option value="salao">Salão de Beleza</option>
                  <option value="clinica">Clínica</option>
                  <option value="academia">Academia</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', background: '#00e5a0', color: '#000', fontWeight: '700', fontSize: '16px', borderRadius: '10px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 12px' }}>
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
          </p>
          <button onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({ email: '', password: '', empresaNome: '', empresaSegmento: '' }) }}
            style={{ background: 'none', border: 'none', color: '#00e5a0', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>
            {isLogin ? 'Criar conta' : 'Fazer login'}
          </button>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
          <button onClick={() => router.push('/barbearia-demo')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
            👀 Ver Demo sem login
          </button>
        </div>
      </div>
    </div>
  )
}