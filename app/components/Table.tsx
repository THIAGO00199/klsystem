'use client'

import React from 'react'

type Column<Row extends object> = {
  key: string
  label: string
  render?: (value: unknown, row: Row) => React.ReactNode
}

type TableProps<Row extends object> = {
  columns: Column<Row>[]
  data: Row[]
  onRowClick?: (row: Row) => void
  isLoading?: boolean
  actions?: {
    onEdit?: (row: Row) => void
    onDelete?: (row: Row) => void
  }
}

export function Table<Row extends object>({
  columns,
  data,
  onRowClick,
  isLoading = false,
  actions,
}: TableProps<Row>) {
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
        <thead>
          <tr className="border-b border-slate-700">
            {columns.map((column) => (
              <th
                key={column.key}
                className="text-left px-6 py-3 text-sm font-semibold text-slate-300"
              >
                {column.label}
              </th>
            ))}
            {(actions?.onEdit || actions?.onDelete) && (
              <th className="text-left px-6 py-3 text-sm font-semibold text-slate-300">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-8">
                <span className="animate-spin" aria-label="Carregando">⚙️</span>
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={index}
                className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => {
                  const value = (row as Record<string, unknown>)[column.key]
                  const fallback =
                    value == null || value === false ? '-' : String(value)
                  return (
                    <td key={column.key} className="px-6 py-4 text-slate-300">
                      {column.render ? column.render(value, row) : fallback}
                    </td>
                  )
                })}
                {(actions?.onEdit || actions?.onDelete) && (
                  <td className="px-6 py-4 flex gap-2">
                    {actions?.onEdit && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          actions.onEdit?.(row)
                        }}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        ✏️ Editar
                      </button>
                    )}
                    {actions?.onDelete && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
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