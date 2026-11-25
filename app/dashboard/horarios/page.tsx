'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSupabase } from '@/app/hooks/useSupabase'
import { Button } from '@/app/components/Button'
import { Modal } from '@/app/components/Modal'
import { FormInput } from '@/app/components/FormInput'
import { Card } from '@/app/components/Card'

const DEMO_EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000'

const DIAS = [
  { num: 1, label: 'Segunda' },
  { num: 2, label: 'Terça' },
  { num: 3, label: 'Quarta' },
  { num: 4, label: 'Quinta' },
  { num: 5, label: 'Sexta' },
  { num: 6, label: 'Sábado' },
  { num: 0, label: 'Domingo' }
]

interface Profissional {
  id: string
  nome: string
  especialidade: string
}

interface Horario {
  id: string
  profissional_id: string
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  intervalo_min: number
  ativo: boolean
}

export default function HorariosPage() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [profSelecionado, setProfSelecionado] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [diaSelecionado, setDiaSelecionado] = useState<number>(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    hora_inicio: '09:00',
    hora_fim: '18:00',
    intervalo_min: '30'
  })

  const { loading, fetchData, insertData, updateData, deleteData } = useSupabase()

  const loadProfissionais = useCallback(async () => {
    const data = await fetchData('profissionais', { empresa_id: DEMO_EMPRESA_ID })
    if (data && data.length > 0) {
      const lista = data as Profissional[]
      setProfissionais(lista)
      setProfSelecionado(lista[0].id)
    }
  }, [fetchData])

  const loadHorarios = useCallback(async () => {
    if (!profSelecionado) {
      setHorarios([])
      return
    }
    const data = await fetchData('horarios', { profissional_id: profSelecionado })
    if (data) setHorarios(data as Horario[])
  }, [fetchData, profSelecionado])

  useEffect(() => {
    // Initial async data load; state changes occur after the database request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfissionais()
  }, [loadProfissionais])

  useEffect(() => {
    // Async data load after the selected professional changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHorarios()
  }, [loadHorarios])

  // Pega horário de um dia específico
  const getHorarioDia = (dia: number) =>
    horarios.find(h => h.dia_semana === dia && h.ativo)

  const handleAbrirModal = (dia: number) => {
    const horarioExistente = getHorarioDia(dia)
    setDiaSelecionado(dia)
    setEditingId(horarioExistente?.id || null)
    setFormData({
      hora_inicio: horarioExistente?.hora_inicio?.slice(0, 5) || '09:00',
      hora_fim: horarioExistente?.hora_fim?.slice(0, 5) || '18:00',
      intervalo_min: String(horarioExistente?.intervalo_min || 30)
    })
    setModalOpen(true)
  }

  const handleSalvar = async () => {
    const payload = {
      profissional_id: profSelecionado,
      dia_semana: diaSelecionado,
      hora_inicio: formData.hora_inicio,
      hora_fim: formData.hora_fim,
      intervalo_min: parseInt(formData.intervalo_min),
      ativo: true
    }

    if (editingId) {
      await updateData('horarios', editingId, payload)
    } else {
      await insertData('horarios', payload)
    }

    await loadHorarios()
    setModalOpen(false)
    alert('✅ Horário salvo!')
  }

  const handleRemover = async (dia: number) => {
    const horario = getHorarioDia(dia)
    if (!horario) return
    await updateData('horarios', horario.id, { ativo: false })
    await loadHorarios()
    alert('✅ Dia de folga definido!')
  }

  const nomeProfSelecionado = profissionais.find(p => p.id === profSelecionado)?.nome || ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">⏰ Horários</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure a disponibilidade de cada profissional
        </p>
      </div>

      {/* Sem profissionais */}
      {profissionais.length === 0 && !loading && (
        <Card variant="accent">
          <p className="text-slate-300 text-center py-4">
            Nenhum profissional cadastrado ainda.{' '}
            <Link href="/dashboard/profissionais" className="text-emerald-400 underline">
              Cadastre um profissional primeiro.
            </Link>
          </p>
        </Card>
      )}

      {profissionais.length > 0 && (
        <>
          {/* Seletor de profissional */}
          <Card variant="default">
            <p className="text-slate-400 text-sm mb-3 font-medium">Profissional</p>
            <div className="flex gap-3 flex-wrap">
              {profissionais.map(prof => (
                <button
                  key={prof.id}
                  onClick={() => setProfSelecionado(prof.id)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    profSelecionado === prof.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {prof.nome}
                </button>
              ))}
            </div>
          </Card>

          {/* Grade de dias */}
          <div className="grid grid-cols-1 gap-3">
            {DIAS.map(dia => {
              const horario = getHorarioDia(dia.num)
              const temHorario = !!horario

              return (
                <Card key={dia.num} variant="default">
                  <div className="flex items-center justify-between">
                    {/* Dia + horário */}
                    <div className="flex items-center gap-4">
                      <div className="w-24">
                        <p className="text-white font-semibold">{dia.label}</p>
                      </div>

                      {temHorario ? (
                        <div className="flex items-center gap-3">
                          <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-sm font-semibold">
                            {horario.hora_inicio.slice(0, 5)} — {horario.hora_fim.slice(0, 5)}
                          </span>
                          <span className="text-slate-500 text-sm">
                            a cada {horario.intervalo_min} min
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-sm italic">Folga / sem atendimento</span>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAbrirModal(dia.num)}
                      >
                        {temHorario ? '✏️ Editar' : '➕ Adicionar'}
                      </Button>
                      {temHorario && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemover(dia.num)}
                        >
                          Folga
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Resumo */}
          <div className="text-slate-500 text-sm text-center">
            {nomeProfSelecionado} trabalha{' '}
            <span className="text-emerald-400 font-semibold">
              {horarios.filter(h => h.ativo).length} dia(s)
            </span>{' '}
            por semana
          </div>
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Horário — ${DIAS.find(d => d.num === diaSelecionado)?.label}`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Entrada
              </label>
              <input
                type="time"
                value={formData.hora_inicio}
                onChange={e => setFormData({ ...formData, hora_inicio: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Saída
              </label>
              <input
                type="time"
                value={formData.hora_fim}
                onChange={e => setFormData({ ...formData, hora_fim: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <FormInput
            label="Intervalo entre agendamentos (minutos)"
            name="intervalo_min"
            type="select"
            value={formData.intervalo_min}
            onChange={e => setFormData({ ...formData, intervalo_min: e.target.value })}
            options={[
              { value: '15', label: '15 minutos' },
              { value: '20', label: '20 minutos' },
              { value: '30', label: '30 minutos' },
              { value: '45', label: '45 minutos' },
              { value: '60', label: '1 hora' }
            ]}
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSalvar}
              isLoading={loading}
              className="flex-1"
            >
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}