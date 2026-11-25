import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  params: Promise<{ slug: string }>
}

export default async function EmpresaPage({ params }: Props) {
  const { slug } = await params

  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (!empresa) return notFound()

  const { data: visual } = await supabase
    .from('personalizacao')
    .select('*')
    .eq('empresa_id', empresa.id)
    .single()

  const { data: profissionais } = await supabase
    .from('profissionais')
    .select('*')
    .eq('empresa_id', empresa.id)
    .eq('ativo', true)
    .order('ordem')

  const { data: servicos } = await supabase
    .from('servicos')
    .select('*')
    .eq('empresa_id', empresa.id)
    .eq('ativo', true)

  const cor = visual?.cor_primaria ?? '#00e5a0'
  const fundo = visual?.cor_fundo ?? '#0a0a0f'
  const segmento = empresa.segmento.charAt(0).toUpperCase() + empresa.segmento.slice(1)

  function formatPreco(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function formatDuracao(min: number) {
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '16px 20px',
  }

  return (
    <main style={{ background: fundo, color: '#fff', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      {/* HERO */}
      <section style={{
        background: `linear-gradient(135deg, ${fundo} 0%, #111127 100%)`,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '60px 24px',
        textAlign: 'center'
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `${cor}20`, border: `2px solid ${cor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, margin: '0 auto 20px'
        }}>
          ✂️
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 8px' }}>
          {empresa.nome}
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, margin: '0 0 8px' }}>
          {segmento}
        </p>

        {visual?.texto_boas_vindas && (
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, maxWidth: 500, margin: '12px auto 0' }}>
            {visual.texto_boas_vindas}
          </p>
        )}

        <a
          href={`/${slug}/agendar`}
          style={{
            display: 'inline-block', marginTop: 28,
            padding: '14px 36px', background: cor,
            color: '#000', fontWeight: 700, fontSize: 16,
            borderRadius: 12, textDecoration: 'none'
          }}
        >
          Agendar agora
        </a>
      </section>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>

        {/* SERVIÇOS */}
        {servicos && servicos.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Serviços</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 24px' }}>
              O que oferecemos
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {servicos.map((s: any) => (
                <div key={s.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{s.nome}</p>
                    {s.descricao && (
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0' }}>
                        {s.descricao}
                      </p>
                    )}
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0' }}>
                      ⏱ {formatDuracao(s.duracao_min)}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <span style={{ color: cor, fontWeight: 700, fontSize: 17 }}>
                      {formatPreco(s.preco)}
                    </span>
                    <a
                      href={`/${slug}/agendar?servico=${s.id}`}
                      style={{
                        padding: '8px 18px',
                        background: `${cor}20`,
                        color: cor,
                        border: `1px solid ${cor}40`,
                        borderRadius: 8, fontSize: 13,
                        fontWeight: 600, textDecoration: 'none'
                      }}
                    >
                      Agendar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* EQUIPE */}
        {profissionais && profissionais.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Nossa Equipe</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 24px' }}>
              Profissionais especializados
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {profissionais.map((p: any) => (
                <div key={p.id} style={{ ...cardStyle, textAlign: 'center' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: `${cor}20`, border: `2px solid ${cor}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, margin: '0 auto 12px', overflow: 'hidden'
                  }}>
                    {p.foto_url
                      ? <img src={p.foto_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : p.nome.charAt(0).toUpperCase()
                    }
                  </div>

                  <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>{p.nome}</p>

                  {p.especialidade && (
                    <p style={{ color: cor, fontSize: 12, fontWeight: 500, margin: '0 0 8px' }}>
                      {p.especialidade}
                    </p>
                  )}

                  {p.bio && (
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
                      {p.bio}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BOTÃO FINAL */}
        <div style={{ textAlign: 'center', paddingTop: 16 }}>
          <a
            href={`/${slug}/agendar`}
            style={{
              display: 'inline-block', padding: '16px 48px',
              background: cor, color: '#000',
              fontWeight: 700, fontSize: 17,
              borderRadius: 12, textDecoration: 'none'
            }}
          >
            Agendar agora ✂️
          </a>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 20 }}>
            Agendamento online pelo KL System
          </p>
        </div>

      </div>
    </main>
  )
}