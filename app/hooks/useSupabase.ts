'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/app/lib/supabase'

/**
 * Hook customizado para operações no Supabase
 * Simplifica chamadas ao banco com tratamento de erro automático
 */
export function useSupabase() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Função genérica para SELECT (ler dados)
   * @param table - Nome da tabela
   * @param filters - Objeto com filtros (ex: { empresa_id: 'xxx' })
   * @returns Array de dados ou null se erro
   */
  const fetchData = useCallback(
    async (table: string, filters?: Record<string, unknown>) => {
      setLoading(true)
      setError(null)

      try {
        let query = supabase.from(table).select('*')

        // Aplica filtros se existirem
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value as never)
          })
        }

        const { data, error: err } = await query

        if (err) throw err
        return data
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao buscar dados'
        setError(message)
        console.error(message, err)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * Função para INSERT (criar novo registro)
   * @param table - Nome da tabela
   * @param data - Objeto com dados a inserir
   * @returns Dados inseridos ou null se erro
   */
  const insertData = useCallback(
    async (table: string, data: Record<string, unknown>) => {
      setLoading(true)
      setError(null)

      try {
        const { data: result, error: err } = await supabase
          .from(table)
          .insert([data as never])
          .select()

        if (err) throw err
        return result?.[0] || null
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao criar registro'
        setError(message)
        console.error(message, err)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * Função para UPDATE (atualizar registro)
   * @param table - Nome da tabela
   * @param id - ID do registro
   * @param data - Objeto com dados a atualizar
   * @returns true se sucesso, false se erro
   */
  const updateData = useCallback(
    async (table: string, id: string, data: Record<string, unknown>) => {
      setLoading(true)
      setError(null)

      try {
        const { error: err } = await supabase
          .from(table)
          .update(data as never)
          .eq('id', id)

        if (err) throw err
        return true
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar registro'
        setError(message)
        console.error(message, err)
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * Função para DELETE (deletar registro)
   * @param table - Nome da tabela
   * @param id - ID do registro
   * @returns true se sucesso, false se erro
   */
  const deleteData = useCallback(
    async (table: string, id: string) => {
      setLoading(true)
      setError(null)

      try {
        const { error: err } = await supabase
          .from(table)
          .delete()
          .eq('id', id)

        if (err) throw err
        return true
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao deletar registro'
        setError(message)
        console.error(message, err)
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    loading,
    error,
    fetchData,
    insertData,
    updateData,
    deleteData
  }
}