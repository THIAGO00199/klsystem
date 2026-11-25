'use client'

import { useRouter, usePathname } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
              KL System
            </h1>
            <p className="text-slate-400 text-sm mt-1">Painel de Controle</p>
          </div>
          <button
            onClick={() => router.push('/auth')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 h-fit lg:sticky lg:top-6">
            <h2 className="text-lg font-bold text-white mb-4">Menu</h2>
            <nav className="space-y-2">
              <button
                onClick={() => router.push('/dashboard')}
                className={`w-full text-left px-4 py-2 rounded-lg font-semibold block transition-colors ${
                  pathname === '/dashboard'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => router.push('/dashboard/profissionais')}
                className={`w-full text-left px-4 py-2 rounded-lg block transition-colors ${
                  pathname === '/dashboard/profissionais'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                👥 Profissionais
              </button>
              <button
                onClick={() => router.push('/dashboard/servicos')}
                className={`w-full text-left px-4 py-2 rounded-lg block transition-colors ${
                  pathname === '/dashboard/servicos'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                🔧 Serviços
              </button>
              <button
                onClick={() => router.push('/dashboard/horarios')}
                className={`w-full text-left px-4 py-2 rounded-lg block transition-colors ${
                  pathname === '/dashboard/horarios'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                ⏰ Horários
              </button>
              <button
                onClick={() => router.push('/dashboard/agendamentos')}
                className={`w-full text-left px-4 py-2 rounded-lg block transition-colors ${
                  pathname === '/dashboard/agendamentos'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                📅 Agendamentos
              </button>
              <button
                onClick={() => router.push('/dashboard/personalizar')}
                className={`w-full text-left px-4 py-2 rounded-lg block transition-colors ${
                  pathname === '/dashboard/personalizar'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                🎨 Personalizar
              </button>
              <button
                onClick={() => router.push('/dashboard/configuracoes')}
                className={`w-full text-left px-4 py-2 rounded-lg block transition-colors ${
                  pathname === '/dashboard/configuracoes'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                ⚙️ Configurações
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}