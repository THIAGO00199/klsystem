'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Servico {
  id: string
  nome: string
  preco: number
  duracao_min: number
  descricao?: string
}

interface Profissional {
  id: string
  nome: string
  especialidade?: string
  foto_url?: string
}

interface Horario {
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  intervalo_min: number
}

interface Empresa {
  id: string
  nome: string
  telefone?: string | null
}

interface Visual {
  cor_primaria?: string | null
  cor_fundo?: string | null
  texto_boas_vindas?: string | null
}

function gerarHorarios(horarios: Horario[], data: string, duracaoMin: number): string[] {
  const date = new Date(data + 'T00:00:00')
  const diaSemana = date.getDay()
  const horarioDia = horarios.find(h => h.dia_semana === diaSemana)
  if (!horarioDia) return []
  const slots: string[] = []
  const [hIni, mIni] = horarioDia.hora_inicio.split(':').map(Number)
  const [hFim, mFim] = horarioDia.hora_fim.split(':').map(Number)
  const inicioMin = hIni * 60 + mIni
  const fimMin = hFim * 60 + mFim
  let atual = inicioMin
  while (atual + duracaoMin <= fimMin) {
    const h = Math.floor(atual / 60).toString().padStart(2, '0')
    const m = (atual % 60).toString().padStart(2, '0')
    slots.push(`${h}:${m}`)
    atual += horarioDia.intervalo_min
  }
  return slots
}

function proximosDias(horarios: Horario[]): string[] {
  const dias: string[] = []
  const diasComHorario = horarios.map(h => h.dia_semana)
  const hoje = new Date()
  for (let i = 1; i <= 30; i++) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + i)
    if (diasComHorario.includes(d.getDay())) {
      dias.push(d.toISOString().split('T')[0])
    }
  }
  return dias
}

function formatPreco(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDuracao(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function formatData(dataStr: string) {
  const d = new Date(dataStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

export default function AgendarPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = params.slug as string

  const [step, setStep] = useState(1)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [visual, setVisual] = useState<Visual | null>(null)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [diasDisponiveis, setDiasDisponiveis] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [concluido, setConcluido] = useState(false)

  const [servicoId, setServicoId] = useState(searchParams.get('servico') || '')
  const [profId, setProfId] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      const { data: emp, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('slug', slug)
        .single()

      if (empresaError || !emp) {
        router.push('/')
        return
      }

      const empresaAtual = emp as Empresa
      setEmpresa(empresaAtual)

      const { data: vis } = await supabase
        .from('personalizacao')
        .select('*')
        .eq('empresa_id', empresaAtual.id)
        .single()
      setVisual((vis as Visual | null) ?? null)

      const { data: servs } = await supabase
        .from('servicos')
        .select('*')
        .eq('empresa_id', empresaAtual.id)
        .eq('ativo', true)
      setServicos((servs as Servico[] | null) ?? [])

      const { data: profs } = await supabase
        .from('profissionais')
        .select('*')
        .eq('empresa_id', empresaAtual.id)
        .eq('ativo', true)
        .order('ordem')
      setProfissionais((profs as Profissional[] | null) ?? [])
    } catch (error) {
      console.error('Erro ao carregar dados do agendamento:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [router, slug])

  const carregarHorariosProfissional = useCallback(async () => {
    if (!profId) {
      setHorarios([])
      setDiasDisponiveis([])
      return
    }

    const { data: hors, error } = await supabase
      .from('horarios')
      .select('*')
      .eq('profissional_id', profId)
      .eq('ativo', true)

    if (error) {
      console.error('Erro ao carregar horários:', error)
      setHorarios([])
      setDiasDisponiveis([])
      return
    }

    const lista = (hors as Horario[] | null) ?? []
    setHorarios(lista)
    setDiasDisponiveis(proximosDias(lista))
  }, [profId])

  useEffect(() => {
    // Async route data loading; state updates occur after the Supabase responses.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarDados()
  }, [carregarDados])

  useEffect(() => {
    // Async availability loading after the selected professional changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarHorariosProfissional()
  }, [carregarHorariosProfissional])

  const servicoSelecionado = servicos.find(s => s.id === servicoId)
  const horariosDisponiveis = useMemo(() => {
    if (!data) return []
    return gerarHorarios(horarios, data, servicoSelecionado?.duracao_min || 60)
  }, [data, horarios, servicoSelecionado])

  const handleConfirmar = async () => {
    if (!empresa) return
    if (!nome.trim() || !telefone.trim()) { alert('Preencha seu nome e telefone!'); return }
    setSalvando(true)
    let clienteId = ''
    const { data: clienteExistente } = await supabase.from('clientes').select('id').eq('empresa_id', empresa.id).eq('telefone', telefone).single()
    if (clienteExistente) {
      clienteId = clienteExistente.id
    } else {
      const { data: novoCliente } = await supabase.from('clientes').insert({ empresa_id: empresa.id, nome, telefone }).select('id').single()
      clienteId = novoCliente?.id || ''
    }
    if (!clienteId) { setSalvando(false); alert('Erro ao salvar cliente'); return }
    const { error } = await supabase.from('agendamentos').insert({
      empresa_id: empresa.id,
      cliente_id: clienteId,
      profissional_id: profId,
      servico_id: servicoId,
      data_hora: `${data}T${hora}:00`,
      status: 'confirmado'
    })
    setSalvando(false)
    if (error) { alert('Erro: ' + error.message); return }
    setConcluido(true)
  }

  const profSelecionado = profissionais.find(p => p.id === profId)
  const cor = visual?.cor_primaria || '#00e5a0'
  const fundo = visual?.cor_fundo || '#0a0a0f'
  const telEmpresa = empresa?.telefone?.replace(/\D/g, '') || ''
  const msgWhatsApp = empresa ? encodeURIComponent(
    `Olá ${empresa.nome}! Agendei um horário:\n` +
    `📋 Serviço: ${servicoSelecionado?.nome}\n` +
    `👤 Profissional: ${profSelecionado?.nome}\n` +
    `📅 Data: ${data ? formatData(data) : ''} às ${hora}\n` +
    `👤 Nome: ${nome}\n` +
    `📱 Telefone: ${telefone}`
  ) : ''

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '16px 20px', cursor: 'pointer'
  }
  const cardSelectedStyle: React.CSSProperties = {
    ...cardStyle, background: `${cor}15`, border: `1px solid ${cor}60`
  }
  const btnStyle: React.CSSProperties = {
    display: 'block', width: '100%', padding: '14px',
    background: cor, color: '#000', fontWeight: 700,
    fontSize: 16, borderRadius: 12, border: 'none', cursor: 'pointer', marginTop: 24
  }
  const btnDisabled: React.CSSProperties = {
    ...btnStyle, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed'
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, color: '#fff', fontSize: 15,
    outline: 'none', boxSizing: 'border-box'
  }

  if (loading) {
    return (
      <div style={{ background: fundo, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#fff' }}>Carregando...</p>
      </div>
    )
  }

  if (concluido) {
    return (
      <div style={{ background: fundo, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h1 style={{ color: cor, fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Agendado!</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 32 }}>Seu agendamento foi confirmado com sucesso.</p>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, textAlign: 'left' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Resumo</p>
            <p style={{ color: '#fff', marginBottom: 6 }}>📋 <strong>{servicoSelecionado?.nome}</strong></p>
            <p style={{ color: '#fff', marginBottom: 6 }}>👤 {profSelecionado?.nome}</p>
            <p style={{ color: '#fff', marginBottom: 6 }}>📅 {data ? formatData(data) : ''} às {hora}</p>
            <p style={{ color: '#fff' }}>💰 {servicoSelecionado ? formatPreco(servicoSelecionado.preco) : ''}</p>
          </div>
          {telEmpresa && (
            <a href={`https://wa.me/55${telEmpresa}?text=${msgWhatsApp}`} target="_blank" rel="noreferrer"
              style={{ display: 'block', padding: '14px 24px', background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 12, textDecoration: 'none', marginBottom: 12 }}>
              💬 Confirmar pelo WhatsApp
            </a>
          )}
          <a href={`/${slug}`} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none' }}>
            Voltar ao início
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: fundo, minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#fff' }}>

      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href={`/${slug}`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 20 }}>←</a>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{empresa?.nome}</p>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Agendamento online</p>
        </div>
      </div>

      <div style={{ display: 'flex', padding: '16px 24px', gap: 8 }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= n ? cor : 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '8px 24px 48px' }}>

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Escolha o serviço</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 20 }}>O que você quer fazer?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {servicos.map(s => (
                <div key={s.id} onClick={() => { setServicoId(s.id); setData(''); setHora('') }} style={servicoId === s.id ? cardSelectedStyle : cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 600, margin: 0 }}>{s.nome}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0' }}>⏱ {formatDuracao(s.duracao_min)}</p>
                    </div>
                    <span style={{ color: cor, fontWeight: 700, fontSize: 17 }}>{formatPreco(s.preco)}</span>
                  </div>
                </div>
              ))}
            </div>
            <button style={servicoId ? btnStyle : btnDisabled} disabled={!servicoId} onClick={() => setStep(2)}>
              Continuar →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Escolha o profissional</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 20 }}>Com quem você quer ser atendido?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {profissionais.map(p => (
                <div key={p.id} onClick={() => { setProfId(p.id); setData(''); setHora('') }} style={{ ...(profId === p.id ? cardSelectedStyle : cardStyle), display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, background: `${cor}20`, border: `2px solid ${cor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, overflow: 'hidden' }}>
                    {p.foto_url ? <img src={p.foto_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.nome.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{p.nome}</p>
                    {p.especialidade && <p style={{ color: cor, fontSize: 13, margin: '2px 0 0' }}>{p.especialidade}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setStep(1)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#fff', flex: 1, marginTop: 0 }}>← Voltar</button>
              <button style={profId ? { ...btnStyle, flex: 2, marginTop: 0 } : { ...btnDisabled, flex: 2, marginTop: 0 }} disabled={!profId} onClick={() => setStep(3)}>Continuar →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Escolha data e horário</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 20 }}>Quando você quer ser atendido?</p>
            {diasDisponiveis.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px 0' }}>Carregando horários...</p>}
            {diasDisponiveis.length > 0 && (
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Data</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                  {diasDisponiveis.slice(0, 14).map(d => (
                    <button key={d} onClick={() => { setData(d); setHora('') }} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: data === d ? cor : 'rgba(255,255,255,0.07)', color: data === d ? '#000' : '#fff' }}>
                      {formatData(d)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {data && horariosDisponiveis.length > 0 && (
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Horário</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {horariosDisponiveis.map(h => (
                    <button key={h} onClick={() => setHora(h)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, background: hora === h ? cor : 'rgba(255,255,255,0.07)', color: hora === h ? '#000' : '#fff' }}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {data && horariosDisponiveis.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)' }}>Sem horários disponíveis nesse dia.</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setStep(2)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#fff', flex: 1, marginTop: 0 }}>← Voltar</button>
              <button style={data && hora ? { ...btnStyle, flex: 2, marginTop: 0 } : { ...btnDisabled, flex: 2, marginTop: 0 }} disabled={!data || !hora} onClick={() => setStep(4)}>Continuar →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Confirmar agendamento</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 20 }}>Quase lá! Informe seus dados.</p>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>Resumo</p>
              <p style={{ margin: '0 0 6px' }}>📋 <strong>{servicoSelecionado?.nome}</strong> — {servicoSelecionado ? formatPreco(servicoSelecionado.preco) : ''}</p>
              <p style={{ margin: '0 0 6px', color: 'rgba(255,255,255,0.7)' }}>👤 {profSelecionado?.nome}</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>📅 {formatData(data)} às {hora}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Seu nome</label>
                <input type="text" placeholder="João Silva" value={nome} onChange={e => setNome(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Seu WhatsApp</label>
                <input type="tel" placeholder="(44) 99999-9999" value={telefone} onChange={e => setTelefone(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setStep(3)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#fff', flex: 1, marginTop: 0 }}>← Voltar</button>
              <button style={nome && telefone ? { ...btnStyle, flex: 2, marginTop: 0 } : { ...btnDisabled, flex: 2, marginTop: 0 }} disabled={!nome || !telefone || salvando} onClick={handleConfirmar}>
                {salvando ? 'Salvando...' : '✅ Confirmar'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}