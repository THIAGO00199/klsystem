'use client'

import { useState, useCallback } from 'react'

/**
 * Hook para gerenciar estado de formulários
 * Simplifica mudança de valores e reset
 */
export function useForm<T extends Record<string, unknown>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues)

  /**
   * Atualiza um campo do formulário
   * @param e - Evento do input
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target

      setValues((prev) => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      }))
    },
    []
  )

  /**
   * Atualiza múltiplos campos de uma vez
   * @param newValues - Objeto com novos valores
   */
  const setFieldValues = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }))
  }, [])

  /**
   * Reseta o formulário aos valores iniciais
   */
  const reset = useCallback(() => {
    setValues(initialValues)
  }, [initialValues])

  return {
    values,
    handleChange,
    setFieldValues,
    reset
  }
}