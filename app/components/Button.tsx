'use client'

import React from 'react'

/**
 * Componente de botão reutilizável com variantes
 * Oferece diferentes estilos: primary, secondary, danger, success
 */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Variante de estilo
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  // Se está carregando
  isLoading?: boolean
  // Ícone opcional antes do texto
  icon?: React.ReactNode
  // Tamanho do botão
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'primary',
  isLoading = false,
  icon,
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // Cores base para cada variante
  const variantStyles = {
    primary: 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:opacity-90 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-300',
    danger: 'bg-red-600/80 hover:bg-red-700 text-white',
    success: 'bg-emerald-600/80 hover:bg-emerald-700 text-white'
  }

  // Tamanhos
  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        font-semibold rounded-lg transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Mostra ícone se existir */}
      {icon && !isLoading && <span>{icon}</span>}

      {/* Mostra loading spinner ou texto */}
      {isLoading ? (
        <>
          <span className="animate-spin">⚙️</span>
          Carregando...
        </>
      ) : (
        children
      )}
    </button>
  )
}