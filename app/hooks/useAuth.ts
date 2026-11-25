'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

interface Empresa {
  id: string
  nome: string
  slug: string
  email: string
}

export function useAuth() {
  const router = useRouter()
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarUsuario()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setEmpresa(null)
        setLoading(false)
      } else {
        carregarEmpresa(session.user.email || '')
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const carregarUsuario = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setEmpresa(null)
        setLoading(false)
        return
      }
      await carregarEmpresa(session.user.email || '')
    } catch {
      setLoading(false)
    }
  }

  const carregarEmpresa = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (error) console.error('Erro empresa:', error)
      setEmpresa(data || null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setEmpresa(null)
    router.push('/auth')
  }

  return { empresa, loading, logout }
}