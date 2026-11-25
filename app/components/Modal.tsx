'use client'

import React from 'react'

/**
 * Componente Modal para diálogos
 * Renderiza um backdrop + conteúdo centralizado
 */

interface ModalProps {
  // Se o modal está aberto
  isOpen: boolean
  // Função para fechar
  onClose: () => void
  // Título do modal
  title?: string
  // Conteúdo
  children: React.ReactNode
  // Tamanho: sm, md, lg
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}: ModalProps) {
  // Se não está aberto, não renderiza nada
  if (!isOpen) return null

  // Tamanhos de largura
  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  }

  return (
    <>
      {/* Backdrop (fundo escuro) - clicável pra fechar */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`
            bg-slate-800 border border-slate-700 rounded-lg
            shadow-2xl w-full ${sizeStyles[size]}
            animate-in fade-in zoom-in-95
          `}
          onClick={(e) => e.stopPropagation()} // Evita fechar ao clicar no modal
        >
          {/* Header */}
          {title && (
            <div className="border-b border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {/* Conteúdo */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  )
}