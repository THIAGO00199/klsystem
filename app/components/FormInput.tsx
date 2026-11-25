'use client'

import React from 'react'

/**
 * Componente de input reutilizável
 * Suporta text, email, password, number, textarea e select
 */

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Label do input
  label?: string
  // Mensagem de erro
  error?: string
  // Se é obrigatório
  required?: boolean
  // Tipo: input ou textarea
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select'
  // Opções para select
  options?: Array<{ value: string; label: string }>
}

export function FormInput({
  label,
  error,
  required,
  type = 'text',
  options,
  className = '',
  ...props
}: FormInputProps) {
  // Se for textarea, renderiza <textarea>
  if (type === 'textarea') {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {label} {required && <span className="text-red-400">*</span>}
          </label>
        )}
        <textarea
          className={`
            w-full px-4 py-2 bg-slate-700 border border-slate-600
            rounded-lg text-white placeholder-slate-500
            focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all
            ${error ? 'border-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
      </div>
    )
  }

  // Se for select, renderiza <select>
  if (type === 'select') {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {label} {required && <span className="text-red-400">*</span>}
          </label>
        )}
        <select
          className={`
            w-full px-4 py-2 bg-slate-700 border border-slate-600
            rounded-lg text-white
            focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all
            ${error ? 'border-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
        >
          <option value="">Selecione uma opção</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
      </div>
    )
  }

  // Renderiza input normal (text, email, password, number)
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input
        type={type}
        className={`
          w-full px-4 py-2 bg-slate-700 border border-slate-600
          rounded-lg text-white placeholder-slate-500
          focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all
          ${error ? 'border-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  )
}