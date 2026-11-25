'use client'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/app/hooks/useSupabase'
import { useForm } from '@/app/hooks/useForm'
import { Button } from '@/app/components/Button'
import { FormInput } from '@/app/components/FormInput'
import { Modal } from '@/app/components/Modal'
import { Table } from '@/app/components/Table'
import { Card } from '@/app/components/Card'

// UUID fixo da empresa demo (igual ao profissionais)
const DEMO_EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000'

interface Servico {
  id: string
  empresa_id: string
  nome: string
  descricao?: string
  preco: number
  duracao_min: number
  categoria?: string
  ativo: boolean
  criado_em: string
}

export default function ServicosPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const { loading, error, fetchData, insertData, updateData, deleteData } = useSupabase()

  const { values, handleChange, reset, setFieldValues } = useForm({
    nome: '',
    descricao: '',
    preco: '',
    duracao_min: '',
    categoria: ''
  })

  useEffect(() => {
    loadServicos()
  }, [])

  const loadServicos = async () => {
    const data = await fetchData('servicos', { empresa_id: DEMO_EMPRESA_ID })
    if (data) setServicos(data)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!values.nome.trim()) errors.nome = 'Nome é obrigatório'
    if (!values.preco) errors.preco = 'Preço é obrigatório'
    if (!values.duracao_min) errors.duracao_min = 'Duração é obrigatória'
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleOpenModal = () => {
    setEditingId(null)
    reset()
    setValidationErrors({})
    setModalOpen(true)
  }

  const handleEdit = (servico: Servico) => {
    setEditingId(servico.id)
    setFieldValues({
      nome: servico.nome,
      descricao: servico.descricao || '',
      preco: String(servico.preco),
      duracao_min: String(servico.duracao_min),
      categoria: servico.categoria || ''
    })
    setValidationErrors({})
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!validateForm()) return

    const payload = {
      nome: values.nome,
      descricao: values.descricao || null,
      preco: parseFloat(values.preco),
      duracao_min: parseInt(values.duracao_min),
      categoria: values.categoria || null,
      ativo: true
    }

    if (editingId) {
      const success = await updateData('servicos', editingId, payload)
      if (success) {
        await loadServicos()
        setModalOpen(false)
        alert('✅ Serviço atualizado!')
      }
    } else {
      const result = await insertData('servicos', {
        ...payload,
        empresa_id: DEMO_EMPRESA_ID
      })
      if (result) {
        await loadServicos()
        setModalOpen(false)
        alert('✅ Serviço criado!')
      }
    }
  }

  const handleDelete = async (servico: Servico) => {
    const success = await deleteData('servicos', servico.id)
    if (success) {
      await loadServicos()
      alert('✅ Serviço deletado!')
    }
  }

  // Formata preço em R$
  const formatPreco = (valor: number) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // Formata duração em horas/minutos
  const formatDuracao = (min: number) => {
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }

  const columns = [
    { key: 'nome', label: 'Serviço' },
    {
      key: 'preco',
      label: 'Preço',
      render: (value: number) => (
        <span style={{ color: '#00e5a0', fontWeight: 600 }}>
          {formatPreco(value)}
        </span>
      )
    },
    {
      key: 'duracao_min',
      label: 'Duração',
      render: (value: number) => formatDuracao(value)
    },
    {
      key: 'categoria',
      label: 'Categoria',
      render: (value: string) => value || '-'
    },
    {
      key: 'criado_em',
      label: 'Criado em',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    }
  ]

  const categorias = [
    { value: 'cabelo', label: 'Cabelo' },
    { value: 'barba', label: 'Barba' },
    { value: 'estetica', label: 'Estética' },
    { value: 'tratamento', label: 'Tratamento' },
    { value: 'combo', label: 'Combo' },
    { value: 'outro', label: 'Outro' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">🔧 Serviços</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gerencie os serviços oferecidos pelo seu negócio
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={handleOpenModal} icon="➕">
          Novo Serviço
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
          data={servicos}
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
        title={editingId ? 'Editar Serviço' : 'Novo Serviço'}
        size="md"
      >
        <form className="space-y-4">
          <FormInput
            label="Nome do serviço"
            name="nome"
            value={values.nome}
            onChange={handleChange}
            placeholder="ex: Corte + Barba"
            required
            error={validationErrors.nome}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Preço (R$)"
              name="preco"
              type="number"
              value={values.preco}
              onChange={handleChange}
              placeholder="45.00"
              required
              error={validationErrors.preco}
            />
            <FormInput
              label="Duração (minutos)"
              name="duracao_min"
              type="number"
              value={values.duracao_min}
              onChange={handleChange}
              placeholder="60"
              required
              error={validationErrors.duracao_min}
            />
          </div>

          <FormInput
            label="Categoria"
            name="categoria"
            type="select"
            value={values.categoria}
            onChange={handleChange}
            options={categorias}
          />

          <FormInput
            label="Descrição (opcional)"
            name="descricao"
            type="textarea"
            value={values.descricao}
            onChange={handleChange}
            placeholder="Descreva o serviço..."
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