'use client'

import React from 'react'

/**
 * Componente Card para agrupar conteúdo
 * Oferece diferentes variantes
 */

interface CardProps {
  children: React.ReactNode
  // Variante: default, hover, border-accent
  variant?: 'default' | 'hover' | 'accent'
  // Classes customizadas adicionais
  className?: string
}

export function Card({
  children,
  variant = 'default',
  className = ''
}: CardProps) {
  if (!children) {
    throw new Error('Children não foi fornecido');
  }

  const variantStyles = {
    default: 'bg-slate-800 border border-slate-700',
    hover: 'bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer',
    accent: 'bg-slate-800/50 border border-emerald-500/30'
  }

  return (
    <div
      role="region"
      aria-label="Card"
      className={`
        ${variantStyles[variant]}
        rounded-lg p-6
        ${className}
      `}
    >
      {children}
    </div>
  )
}