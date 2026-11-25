'use client'

import React from 'react'

/**
 * Componente Table reutilizável
 * Renderiza tabelas com dados dinâmicos
 */

interface Column {
  // Chave dos dados
  key: string
  // Label da coluna
  label: string
  // Função customizada pra renderizar a célula
  render?: (value: any, row: any) => React.ReactNode
}

interface TableProps {
  // Colunas da tabela
  columns: Column[]
  // Dados (array de objetos)
  data: any[]
  // Função ao clicar em uma linha
  onRowClick?: (row: any) => void
  // Se está carregando
  isLoading?: boolean
  // Ações (ex: editar, deletar)
  actions?: {
    onEdit?: (row: any) => void
    onDelete?: (row: any) => void
  }
}

export function Table({
  columns,
  data,
  onRowClick,
  isLoading,
  actions
}: TableProps) {
  // Se não tem dados e não está carregando
  if (!isLoading && data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        Nenhum registro encontrado
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {/* Header */}
        <thead>
          <tr className="border-b border-slate-700">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-6 py-3 text-sm font-semibold text-slate-300"
              >
                {col.label}
              </th>
            ))}
            {(actions?.onEdit || actions?.onDelete) && (
              <th className="text-left px-6 py-3 text-sm font-semibold text-slate-300">
                Ações
              </th>
            )}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-8">
                <span className="animate-spin">⚙️</span>
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-slate-300">
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key] || '-'}
                  </td>
                ))}

                {/* Coluna de ações */}
                {(actions?.onEdit || actions?.onDelete) && (
                  <td className="px-6 py-4 flex gap-2">
                    {actions?.onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          actions.onEdit?.(row)
                        }}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        ✏️ Editar
                      </button>
                    )}
                    {actions?.onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Tem certeza que quer deletar?')) {
                            actions.onDelete?.(row)
                          }
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        🗑️ Deletar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}