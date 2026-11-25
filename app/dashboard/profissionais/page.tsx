'use client'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/app/hooks/useSupabase'
import { useForm } from '@/app/hooks/useForm'
import { useAuth } from '@/app/hooks/useAuth'
import { Button } from '@/app/components/Button'
import { FormInput } from '@/app/components/FormInput'
import { Modal } from '@/app/components/Modal'
import { Table } from '@/app/components/Table'
import { Card } from '@/app/components/Card'

interface Profissional {
  id: string
  empresa_id: string
  nome: string
  especialidade?: string
  foto_url?: string
  bio?: string
  ativo: boolean
  criado_em: string
}

export default function ProfissionaisPage() {
  const { empresa, loading: authLoading } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const { loading, error, fetchData, insertData, updateData, deleteData } = useSupabase()

  const { values, handleChange, reset, setFieldValues } = useForm({
    nome: '',
    especialidade: '',
    bio: ''
  })

  useEffect(() => {
    if (empresa?.id) {
      loadProfissionais()
    }
  }, [empresa])

  const loadProfissionais = async () => {
    if (!empresa?.id) return
    const data = await fetchData('profissionais', { empresa_id: empresa.id })
    if (data) setProfissionais(data)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!values.nome.trim()) errors.nome = 'Nome é obrigatório'
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleOpenModal = () => {
    setEditingId(null)
    reset()
    setValidationErrors({})
    setModalOpen(true)
  }

  const handleEdit = (profissional: Profissional) => {
    setEditingId(profissional.id)
    setFieldValues({
      nome: profissional.nome,
      especialidade: profissional.especialidade || '',
      bio: profissional.bio || ''
    })
    setValidationErrors({})
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!validateForm()) return
    if (!empresa?.id) return

    const payload = {
      nome: values.nome,
      especialidade: values.especialidade || null,
      bio: values.bio || null,
      ativo: true
    }

    if (editingId) {
      const success = await updateData('profissionais', editingId, payload)
      if (success) {
        await loadProfissionais()
        setModalOpen(false)
        alert('✅ Profissional atualizado!')
      }
    } else {
      const result = await insertData('profissionais', {
        ...payload,
        empresa_id: empresa.id
      })
      if (result) {
        await loadProfissionais()
        setModalOpen(false)
        alert('✅ Profissional criado!')
      }
    }
  }

  const handleDelete = async (profissional: Profissional) => {
    const success = await deleteData('profissionais', profissional.id)
    if (success) {
      await loadProfissionais()
      alert('✅ Profissional deletado!')
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Carregando...</p>
      </div>
    )
  }

  if (!empresa) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Empresa não encontrada</p>
      </div>
    )
  }

  const columns = [
    { key: 'nome', label: 'Nome' },
    {
      key: 'especialidade',
      label: 'Especialidade',
      render: (value: string) => value || '-'
    },
    {
      key: 'criado_em',
      label: 'Criado em',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">👥 Profissionais</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gerencie os profissionais do seu negócio
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={handleOpenModal} icon="➕">
          Novo Profissional
        </Button>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabela */}
      <Card variant="default">
        <Table
          columns={columns}
          data={profissionais}
          isLoading={loading}
          actions={{
            onEdit: handleEdit,
            onDelete: handleDelete
          }}
        />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Profissional' : 'Novo Profissional'}
        size="md"
      >
        <form className="space-y-4">
          <FormInput
            label="Nome"
            name="nome"
            value={values.nome}
            onChange={handleChange}
            placeholder="ex: João Silva"
            required
            error={validationErrors.nome}
          />

          <FormInput
            label="Especialidade"
            name="especialidade"
            value={values.especialidade}
            onChange={handleChange}
            placeholder="ex: Corte e Barba"
          />

          <FormInput
            label="Bio (opcional)"
            name="bio"
            type="textarea"
            value={values.bio}
            onChange={handleChange}
            placeholder="Descrição breve..."
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={loading}
              className="flex-1"
            >
              {editingId ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}