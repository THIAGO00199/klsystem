#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════╗
║   🐝 ENXAME v13 FINAL — O APEX DO SISTEMA MULTIAGENTE      ║
║                                                              ║
║  ⚡ Groq API (2-3 seg respostas)                            ║
║  🧠 6 Agentes com personalidades reais                      ║
║  💬 Chat contínuo e natural                                 ║
║  🗳️  Votação inteligente com confiança                     ║
║  📊 Análise profunda antes de propor                        ║
║  🔄 Debate estruturado: análise → proposta → votação        ║
║  ✅ Você autoriza cada mudança                             ║
║  📈 Histórico completo + estatísticas                       ║
║  🎯 Ciclos adaptativos (5-60 min conforme necessário)       ║
║  🛡️  Segurança: validação + backup automático               ║
║                                                              ║
║  COMANDOS:                                                   ║
║    'aplicar'     → aplica proposta aprovada                 ║
║    'revisar'     → análise completa do projeto              ║
║    'status'      → estado atual do enxame                   ║
║    'histórico'   → últimas decisões                         ║
║    'parar'       → encerra elegantemente                    ║
╚══════════════════════════════════════════════════════════════╝
"""

import os
import sys
import json
import time
import re
import threading
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from collections import deque
from dataclasses import dataclass, field, asdict
from dotenv import load_dotenv
from litellm import completion

load_dotenv()

# ═══════════════════════════════════════════════════════════════
# 🔧 CONFIGURAÇÕES
# ═══════════════════════════════════════════════════════════════
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("❌ ERRO: Configure GROQ_API_KEY no .env")
    sys.exit(1)

os.environ["GROQ_API_KEY"] = GROQ_API_KEY

# Configurações de API
GROQ_MODEL = "groq/llama-3.3-70b-versatile"
MAX_TOKENS = 1024
TEMPERATURE = 0.85
TIMEOUT_API = 30

# Projeto
EXTENSOES_ALVO = {'.py', '.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.json', '.sql', '.md'}
IGNORAR_DIRS = {
    '.next', 'node_modules', 'venv', '__pycache__', 'backups_enxame', 'logs_enxame', 
    '.git', '.vercel', 'dist', 'build', '.turbo', 'coverage', 'target', '.gradle'
}
IGNORAR_ARQUIVOS = {
    'enxame_v13_final.py', '.env', '.env.local', 'package-lock.json', 
    'pnpm-lock.yaml', 'yarn.lock', 'Cargo.lock'
}
MAX_ARQUIVOS_RESUMO = 25
MAX_LINHAS_POR_ARQUIVO = 20
MAX_CHARS_RESUMO = 25000

# Diretórios
BACKUP_DIR = Path("backups_enxame")
LOG_DIR = Path("logs_enxame")
CHAT_LOG = LOG_DIR / "chat_completo.json"
HISTORICO_DECISOES = LOG_DIR / "decisoes.json"
STATS_FILE = LOG_DIR / "stats.json"

# Comportamento
INTERVALO_CICLO_MIN = 300  # 5 min mínimo
INTERVALO_CICLO_MAX = 3600  # 1 hora máximo (se muitas rejeições)
MAX_CICLOS_FALHOS = 5
MAX_AGENTES_FALANDO = 3

# ═══════════════════════════════════════════════════════════════
# 📊 ESTRUTURAS DE DADOS
# ═══════════════════════════════════════════════════════════════
@dataclass
class Voto:
    agente: str
    aprovado: bool
    confianca: float  # 0.0 a 1.0
    comentario: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

@dataclass
class Proposta:
    arquivo: str
    codigo: str
    descricao: str
    prioridade: str  # crítica, alta, média, baixa
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    votos: List[Voto] = field(default_factory=list)
    aplicada: bool = False

@dataclass
class Estatisticas:
    total_propostas: int = 0
    propostas_aprovadas: int = 0
    propostas_rejeitadas: int = 0
    ciclos_executados: int = 0
    tempo_medio_proposta: float = 0.0
    agente_stats: Dict[str, Dict] = field(default_factory=dict)

# ═══════════════════════════════════════════════════════════════
# 🤖 AGENTE
# ═══════════════════════════════════════════════════════════════
class Agente:
    def __init__(self, nome: str, papel: str, emoji: str, personalidade: str, expertise: str):
        self.nome = nome
        self.papel = papel
        self.emoji = emoji
        self.personalidade = personalidade
        self.expertise = expertise
        self.ultima_fala = 0
        self.msgs_enviadas = 0
        self.votos_corretos = 0
        self.votos_totais = 0

    def chamar_groq(self, prompt: str, timeout: int = TIMEOUT_API) -> Optional[str]:
        """Chamada simples e rápida ao Groq."""
        try:
            resp = completion(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=MAX_TOKENS,
                temperature=TEMPERATURE,
                timeout=timeout
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            return None

    def responder_naturalmente(self, contexto: str, ultimas_msg: List[str]) -> str:
        """Responde naturalmente ao chat."""
        prompt = f"""{self.personalidade}
Você é {self.nome} ({self.papel}). {self.expertise}

Contexto do projeto:
{contexto[:2000]}

Últimas mensagens:
{chr(10).join(ultimas_msg[-4:])}

Responda com 1-2 frases curtas, no seu estilo. Seja natural e engraçado.
Máximo 2 frases. NÃO repita informações técnicas óbvias."""
        return self.chamar_groq(prompt) or "[pensando...]"

    def analisar_projeto(self, resumo: str) -> str:
        """Análise profunda do projeto."""
        prompt = f"""{self.personalidade}
Você é {self.nome} ({self.papel}). Especialista em {self.expertise}.

Analise este projeto e identifique O MAIOR PROBLEMA que você vê:
{resumo[:12000]}

Responda EXATAMENTE neste formato (3-4 linhas):
PROBLEMA: [descrição concisa]
PRIORIDADE: crítica/alta/média
IMPACTO: [por que é importante]"""
        return self.chamar_groq(prompt) or ""

    def propor_melhoria(self, resumo: str, problema: str) -> Optional[Dict]:
        """Propõe melhoria estruturada."""
        prompt = f"""{self.personalidade}
Você é {self.nome} (Arquiteto). Especialista em {self.expertise}.

Problema identificado: {problema}

Projeto:
{resumo[:10000]}

Proponha UMA alteração técnica específica.
FORMATO OBRIGATÓRIO:
ARQUIVO: [caminho exato, ex: ./app/utils/api.ts]
DESCRICAO: [1 frase sobre a melhoria]
PRIORIDADE: crítica/alta/média/baixa
CODIGO:
```
[código completo do arquivo MODIFICADO]
```

Responda APENAS com o formato acima. Nada de explicações extras."""
        resp = self.chamar_groq(prompt)
        if not resp:
            return None

        # Parse
        arquivo_match = re.search(r'ARQUIVO:\s*(.+?)(?:\n|$)', resp)
        desc_match = re.search(r'DESCRICAO:\s*(.+?)(?:\n|$)', resp)
        prio_match = re.search(r'PRIORIDADE:\s*(.+?)(?:\n|$)', resp)
        codigo_match = re.search(r'```[\w]*\n(.*?)\n```', resp, re.DOTALL)

        if not all([arquivo_match, desc_match, codigo_match]):
            return None

        arquivo = arquivo_match.group(1).strip()
        descricao = desc_match.group(1).strip()
        prioridade = prio_match.group(1).strip() if prio_match else "média"
        codigo = codigo_match.group(1).strip()

        return {
            "arquivo": arquivo,
            "descricao": descricao,
            "prioridade": prioridade,
            "codigo": codigo
        }

    def opinar(self, proposta: Dict, resumo: str) -> str:
        """Opina sobre a proposta."""
        prompt = f"""{self.personalidade}
Você é {self.nome} ({self.papel}). Especialista em {self.expertise}.

Proposta: alterar {proposta['arquivo']}
Descrição: {proposta['descricao']}

Novo código:
{proposta['codigo'][:1500]}

Contexto do projeto:
{resumo[:2000]}

Dê sua opinião técnica e engraçada (2-3 frases). Seja crítico ou elogioso conforme o caso."""
        return self.chamar_groq(prompt) or "[sem opinião]"

    def votar(self, proposta: Dict, resumo: str) -> Tuple[bool, float, str]:
        """Vota com confiança."""
        prompt = f"""{self.personalidade}
Você é {self.nome} ({self.papel}). Especialista em {self.expertise}.

Proposta: {proposta['arquivo']} - {proposta['descricao']}

Código proposto:
{proposta['codigo'][:1500]}

Responda EXATAMENTE assim (uma linha):
VOTO: APROVADO CONFIANCA: 0.9 MOTIVO: [motivo curto]
OU
VOTO: REPROVADO CONFIANCA: 0.8 MOTIVO: [motivo curto]

Confiança: 0.0-1.0 (quanto certo você está do seu voto)."""
        resp = self.chamar_groq(prompt)
        if not resp:
            return False, 0.5, "sem resposta"

        aprovado = "APROVADO" in resp.upper()
        confianca_match = re.search(r'CONFIANCA:\s*(0\.\d+|1\.0)', resp)
        confianca = float(confianca_match.group(1)) if confianca_match else 0.7
        motivo_match = re.search(r'MOTIVO:\s*(.+?)(?:$|\n)', resp)
        motivo = motivo_match.group(1).strip() if motivo_match else resp[:80]

        self.votos_totais += 1
        return aprovado, confianca, motivo

    def revisar_completo(self, resumo: str) -> str:
        """Revisão profissional completa."""
        prompt = f"""{self.personalidade}
Você é {self.nome} ({self.papel}). Especialista em {self.expertise}.

Faça uma revisão estratégica e técnica COMPLETA deste projeto.
Identifique TOP 3 prioridades de melhoria:

{resumo[:15000]}

Responda em formato:
1. [prioridade 1]: [descrição]
2. [prioridade 2]: [descrição]
3. [prioridade 3]: [descrição]"""
        return self.chamar_groq(prompt) or "[sem análise]"

    def get_stats(self) -> Dict:
        taxa_aprovacao = (self.votos_corretos / self.votos_totais * 100) if self.votos_totais > 0 else 0
        return {
            "mensagens": self.msgs_enviadas,
            "votos_totais": self.votos_totais,
            "taxa_aprovacao": f"{taxa_aprovacao:.1f}%"
        }

# ═══════════════════════════════════════════════════════════════
# 📁 PROJETO
# ═══════════════════════════════════════════════════════════════
def ler_resumo_projeto() -> str:
    """Lê resumo otimizado do projeto."""
    arquivos = []
    
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in IGNORAR_DIRS]
        for file in sorted(files):
            if file in IGNORAR_ARQUIVOS:
                continue
            if any(file.endswith(ext) for ext in EXTENSOES_ALVO):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        linhas = f.readlines()[:MAX_LINHAS_POR_ARQUIVO]
                    if linhas:
                        conteudo = ''.join(linhas).strip()
                        arquivos.append({
                            'path': path,
                            'conteudo': conteudo,
                            'linhas': len(linhas)
                        })
                        if len(arquivos) >= MAX_ARQUIVOS_RESUMO:
                            break
                except:
                    pass
        if len(arquivos) >= MAX_ARQUIVOS_RESUMO:
            break

    # Formata
    texto = []
    for arq in arquivos:
        texto.append(f"📄 {arq['path']} ({arq['linhas']} linhas)\n{arq['conteudo']}\n")

    resumo = '\n'.join(texto)
    if len(resumo) > MAX_CHARS_RESUMO:
        resumo = resumo[:MAX_CHARS_RESUMO] + "\n... (cortado por limite)"
    
    return resumo

def aplicar_mudanca(arquivo: str, codigo: str) -> bool:
    """Aplica mudança com segurança."""
    path = Path(arquivo)
    
    # Validação
    if ".." in arquivo or arquivo.startswith("/"):
        print(f"❌ Caminho suspeito: {arquivo}")
        return False

    # Backup
    BACKUP_DIR.mkdir(exist_ok=True)
    if path.exists():
        backup_name = f"{path.stem}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{path.suffix}"
        backup_path = BACKUP_DIR / backup_name
        path.rename(backup_path)
        print(f"  💾 Backup: {backup_path}")

    # Limpa código
    codigo_limpo = re.sub(r'^```[\w]*\n?', '', codigo, flags=re.MULTILINE)
    codigo_limpo = re.sub(r'\n?```$', '', codigo_limpo)
    codigo_limpo = codigo_limpo.strip()

    # Valida Python
    if arquivo.endswith('.py'):
        try:
            compile(codigo_limpo, arquivo, 'exec')
        except SyntaxError as e:
            print(f"  ❌ Erro de sintaxe: {e}")
            return False

    # Escreve
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(codigo_limpo, encoding='utf-8')
        print(f"  ✅ {arquivo} atualizado")
        return True
    except Exception as e:
        print(f"  ❌ Erro ao escrever: {e}")
        return False

# ═══════════════════════════════════════════════════════════════
# 💬 SALA DE CHAT
# ═══════════════════════════════════════════════════════════════
class SalaChat:
    def __init__(self):
        self.mensagens = deque(maxlen=100)
        self.agentes: List[Agente] = []
        self.contexto = ""
        self.lock = threading.Lock()
        self.running = True
        self.proposta_pendente: Optional[Proposta] = None
        self.historico_propostas: List[Proposta] = []
        self.stats = Estatisticas()
        self.ciclos_falhos = 0
        self.proximo_ciclo = time.time() + INTERVALO_CICLO_MIN

        # Cria dirs
        BACKUP_DIR.mkdir(exist_ok=True)
        LOG_DIR.mkdir(exist_ok=True)

    def adicionar_agente(self, agente: Agente):
        self.agentes.append(agente)

    def enviar(self, autor: str, texto: str, silencioso: bool = False):
        """Envia mensagem ao chat."""
        ts = datetime.now().strftime("%H:%M:%S")
        with self.lock:
            self.mensagens.append({
                "timestamp": ts,
                "autor": autor,
                "texto": texto
            })
        if not silencioso:
            print(f"\n[{ts}] {autor}: {texto}")

    def obter_ultimas(self, n: int = 8) -> List[str]:
        """Obtém últimas mensagens formatadas."""
        with self.lock:
            msgs = list(self.mensagens)[-n:]
        return [f"{m['autor']}: {m['texto']}" for m in msgs]

    def salvar_chat(self):
        """Salva histórico do chat."""
        with open(CHAT_LOG, 'w') as f:
            json.dump(list(self.mensagens), f, indent=2, ensure_ascii=False)

    def salvar_decisoes(self):
        """Salva histórico de decisões."""
        decisoes = []
        for prop in self.historico_propostas:
            votos_dict = [asdict(v) for v in prop.votos]
            decisoes.append({
                "arquivo": prop.arquivo,
                "descricao": prop.descricao,
                "timestamp": prop.timestamp,
                "votos": votos_dict,
                "aplicada": prop.aplicada,
                "prioridade": prop.prioridade
            })
        with open(HISTORICO_DECISOES, 'w') as f:
            json.dump(decisoes, f, indent=2, ensure_ascii=False)

    def salvar_stats(self):
        """Salva estatísticas."""
        stats_dict = {
            "total_propostas": self.stats.total_propostas,
            "aprovadas": self.stats.propostas_aprovadas,
            "rejeitadas": self.stats.propostas_rejeitadas,
            "ciclos": self.stats.ciclos_executados,
            "tempo_medio": self.stats.tempo_medio_proposta,
            "agentes": {ag.nome: ag.get_stats() for ag in self.agentes}
        }
        with open(STATS_FILE, 'w') as f:
            json.dump(stats_dict, f, indent=2, ensure_ascii=False)

    def agentes_conversam(self, mensagem: str):
        """Agentes respondem naturalmente."""
        time.sleep(0.5)
        ultimas = self.obter_ultimas(6)
        respondidos = 0
        
        for agente in self.agentes[:MAX_AGENTES_FALANDO]:
            if respondidos >= MAX_AGENTES_FALANDO:
                break
            if time.time() - agente.ultima_fala < 1.5:
                continue
            
            resposta = agente.responder_naturalmente(self.contexto, ultimas)
            if resposta and resposta != "[pensando...]":
                self.enviar(f"{agente.emoji} {agente.nome}", resposta)
                agente.msgs_enviadas += 1
                agente.ultima_fala = time.time()
                respondidos += 1
                time.sleep(0.7)

    def fase_analise(self) -> str:
        """Fase 1: Análise do projeto."""
        self.enviar("SISTEMA", "📊 FASE 1: ANÁLISE DO PROJETO", silencioso=True)
        arquiteto = next((a for a in self.agentes if a.papel == "arquiteto"), None)
        if not arquiteto:
            return ""

        analise = arquiteto.analisar_projeto(self.contexto)
        self.enviar(f"{arquiteto.emoji} {arquiteto.nome}", f"🔍 Análise: {analise[:200]}...")
        time.sleep(1)
        return analise

    def fase_proposta(self, analise: str) -> Optional[Proposta]:
        """Fase 2: Proposta de melhoria."""
        self.enviar("SISTEMA", "💡 FASE 2: PROPOSTA DE MELHORIA", silencioso=True)
        arquiteto = next((a for a in self.agentes if a.papel == "arquiteto"), None)
        if not arquiteto:
            return None

        melhoria = arquiteto.propor_melhoria(self.contexto, analise)
        if not melhoria:
            self.enviar("SISTEMA", "⚠️ Arquiteto não conseguiu propor nada.")
            return None

        proposta = Proposta(
            arquivo=melhoria['arquivo'],
            codigo=melhoria['codigo'],
            descricao=melhoria['descricao'],
            prioridade=melhoria['prioridade']
        )

        self.enviar(f"{arquiteto.emoji} {arquiteto.nome}", 
                   f"✨ Proposta: `{proposta.arquivo}` ({proposta.prioridade})")
        print(f"\n📋 Descrição: {proposta.descricao}")
        time.sleep(1.5)
        return proposta

    def fase_debate(self, proposta: Proposta):
        """Fase 3: Debate aberto."""
        self.enviar("SISTEMA", "🗣️ FASE 3: DEBATE ABERTO", silencioso=True)
        self.enviar("SISTEMA", f"Agentes opinando sobre `{proposta.arquivo}`...")
        time.sleep(1)

        for agente in self.agentes:
            if agente.papel == "arquiteto":
                continue
            opiniao = agente.opinar(asdict(proposta), self.contexto)
            if opiniao:
                self.enviar(f"{agente.emoji} {agente.nome}", opiniao)
                agente.msgs_enviadas += 1
                time.sleep(0.8)

    def fase_votacao(self, proposta: Proposta) -> bool:
        """Fase 4: Votação formal."""
        self.enviar("SISTEMA", "🗳️ FASE 4: VOTAÇÃO FORMAL", silencioso=True)
        time.sleep(1)

        votos_sim = 0
        confianca_total = 0
        votos_count = 0

        for agente in self.agentes:
            if agente.papel == "arquiteto":
                continue

            aprovado, confianca, motivo = agente.votar(asdict(proposta), self.contexto)
            voto = Voto(
                agente=agente.nome,
                aprovado=aprovado,
                confianca=confianca,
                comentario=motivo
            )
            proposta.votos.append(voto)

            status = "✅" if aprovado else "❌"
            self.enviar(f"{agente.emoji} {agente.nome}", 
                       f"{status} {aprovado and 'APROVADO' or 'REPROVADO'} (confiança: {confianca:.1f})")
            
            if aprovado:
                votos_sim += 1
                agente.votos_corretos += 1
            agente.votos_totais += 1
            confianca_total += confianca
            votos_count += 1
            time.sleep(0.8)

        confianca_media = confianca_total / votos_count if votos_count > 0 else 0
        resultado = votos_sim > votos_count / 2

        self.enviar("SISTEMA", 
                   f"📊 Resultado: {votos_sim}/{votos_count} aprovaram | Confiança média: {confianca_media:.2f}")
        time.sleep(1)
        return resultado

    def ciclo_melhoria(self) -> bool:
        """Ciclo completo: análise → proposta → debate → votação."""
        self.stats.ciclos_executados += 1
        inicio = time.time()

        print("\n" + "="*70)
        print(f"  🚀 CICLO #{self.stats.ciclos_executados} — {datetime.now().strftime('%d/%m %H:%M:%S')}")
        print("="*70)

        self.enviar("SISTEMA", f"🚀 INICIANDO CICLO #{self.stats.ciclos_executados}")

        # Fases
        analise = self.fase_analise()
        if not analise:
            self.enviar("SISTEMA", "❌ Falha na análise. Próximo ciclo em 60s.")
            return False

        proposta = self.fase_proposta(analise)
        if not proposta:
            self.enviar("SISTEMA", "❌ Falha na proposta. Próximo ciclo em 60s.")
            return False

        self.fase_debate(proposta)
        aprovado = self.fase_votacao(proposta)

        if aprovado:
            self.enviar("SISTEMA", "✅ PROPOSTA APROVADA! Digite 'aplicar' para executar.")
            self.proposta_pendente = proposta
            self.ciclos_falhos = 0
        else:
            self.enviar("SISTEMA", "❌ Proposta rejeitada pelo enxame.")
            self.ciclos_falhos += 1

        # Estatísticas
        self.stats.total_propostas += 1
        if aprovado:
            self.stats.propostas_aprovadas += 1
        else:
            self.stats.propostas_rejeitadas += 1

        duracao = time.time() - inicio
        self.stats.tempo_medio_proposta = (
            (self.stats.tempo_medio_proposta * (self.stats.ciclos_executados - 1) + duracao) 
            / self.stats.ciclos_executados
        )

        # Salva
        self.salvar_chat()
        self.salvar_stats()

        tempo_str = f"{duracao:.1f}s"
        print(f"\n  ⏱️ Ciclo completado em {tempo_str}")
        print("="*70)

        return aprovado

    def executar_aplicacao(self) -> bool:
        """Executa aplicação de proposta aprovada."""
        if not self.proposta_pendente:
            self.enviar("SISTEMA", "❌ Nenhuma proposta pendente.")
            return False

        self.enviar("SISTEMA", f"🔨 Aplicando `{self.proposta_pendente.arquivo}`...")
        if aplicar_mudanca(self.proposta_pendente.arquivo, self.proposta_pendente.codigo):
            self.proposta_pendente.aplicada = True
            self.historico_propostas.append(self.proposta_pendente)
            self.salvar_decisoes()
            
            self.enviar("SISTEMA", "🎉 MUDANÇA APLICADA COM SUCESSO!")
            self.contexto = ler_resumo_projeto()
            self.proposta_pendente = None
            return True
        else:
            self.enviar("SISTEMA", "❌ Falha ao aplicar mudança.")
            return False

    def mostrar_revisor_completo(self):
        """Revisão profissional completa."""
        self.enviar("SISTEMA", "📋 REVISÃO COMPLETA DO PROJETO", silencioso=True)
        self.enviar("SISTEMA", "Cada agente faz revisão estratégica...")
        time.sleep(1)

        for agente in self.agentes:
            analise = agente.revisar_completo(self.contexto)
            if analise:
                self.enviar(f"{agente.emoji} {agente.nome}", analise[:400])
                agente.msgs_enviadas += 1
                time.sleep(1.2)

    def mostrar_status(self):
        """Mostra status atual."""
        print("\n" + "─"*60)
        print("  📊 STATUS DO ENXAME")
        print("─"*60)
        print(f"  Ciclos executados: {self.stats.ciclos_executados}")
        print(f"  Propostas: {self.stats.total_propostas} ({self.stats.propostas_aprovadas} ✅ / {self.stats.propostas_rejeitadas} ❌)")
        print(f"  Tempo médio/ciclo: {self.stats.tempo_medio_proposta:.1f}s")
        print(f"  Próximo ciclo automático em: {max(0, int(self.proximo_ciclo - time.time()))}s")
        print(f"  Proposta pendente: {'SIM ⏳' if self.proposta_pendente else 'NÃO'}")
        print("─"*60 + "\n")

    def mostrar_historico(self):
        """Mostra histórico de decisões."""
        print("\n" + "─"*60)
        print("  📜 HISTÓRICO DE DECISÕES")
        print("─"*60)
        if not self.historico_propostas:
            print("  Nenhuma decisão ainda.")
        else:
            for i, prop in enumerate(self.historico_propostas[-10:], 1):
                status = "✅" if prop.aplicada else "❌"
                votos_sim = sum(1 for v in prop.votos if v.aprovado)
                print(f"  {i}. {status} {prop.arquivo} ({votos_sim}/{len(prop.votos)} votos)")
        print("─"*60 + "\n")

    def loop(self):
        """Loop principal interativo."""
        # Thread de escuta
        def escutar_usuario():
            while self.running:
                try:
                    cmd = input().strip()
                    if not cmd:
                        continue

                    cmd_lower = cmd.lower()

                    if cmd_lower in ['sair', 'exit', 'parar', 'quit']:
                        self.running = False
                        self.enviar("SISTEMA", "👋 Enxame encerrando elegantemente...")
                        break

                    elif cmd_lower == 'aplicar':
                        self.executar_aplicacao()

                    elif cmd_lower in ['revisar', 'review', 'análise']:
                        self.mostrar_revisor_completo()

                    elif cmd_lower == 'status':
                        self.mostrar_status()

                    elif cmd_lower in ['historico', 'history', 'decisões']:
                        self.mostrar_historico()

                    else:
                        # Mensagem normal
                        self.enviar("VOCÊ", cmd)
                        threading.Thread(
                            target=self.agentes_conversam,
                            args=(cmd,),
                            daemon=True
                        ).start()

                except EOFError:
                    self.running = False
                    break
                except Exception as e:
                    print(f"⚠️ Erro: {e}")

        threading.Thread(target=escutar_usuario, daemon=True).start()

        # Loop principal
        while self.running:
            agora = time.time()

            # Ciclo automático
            if agora >= self.proximo_ciclo:
                sucesso = self.ciclo_melhoria()

                # Ajusta intervalo conforme resultado
                if sucesso:
                    intervalo = INTERVALO_CICLO_MIN
                else:
                    intervalo = min(INTERVALO_CICLO_MAX, INTERVALO_CICLO_MIN * (2 ** self.ciclos_falhos))

                self.proximo_ciclo = agora + intervalo

            time.sleep(0.5)

        # Finalização
        self.salvar_chat()
        self.salvar_decisoes()
        self.salvar_stats()
        print("\n✅ Enxame finalizado. Histórico salvo em logs_enxame/")

# ═══════════════════════════════════════════════════════════════
# 🚀 MAIN
# ═══════════════════════════════════════════════════════════════
def main():
    print("""
╔════════════════════════════════════════════════════════════════╗
║                  🐝 ENXAME v13 FINAL INICIANDO              ║
║                                                                ║
║  O sistema mais potente de análise e melhoria de código       ║
║  com 6 agentes debatendo, votando e aplicando mudanças.      ║
║                                                                ║
║  COMANDOS: aplicar | revisar | status | histórico | parar     ║
╚════════════════════════════════════════════════════════════════╝
    """)

    sala = SalaChat()

    # Cria agentes
    agentes_data = [
        ("Arquiteto", "arquiteto", "🏛️", 
         "Arquiteto arrogante e perfeccionista. Adora código bem estruturado e elegante.",
         "arquitetura de software, design patterns, refatoração"),
        
        ("Analista", "analista", "🔍",
         "Analista paranóico e detalhista. Encontra bugs onde ninguém vê.",
         "bugs, lógica de programa, casos extremos"),
        
        ("Guardião", "guardiao", "🔐",
         "Guardião dramático e paranóico. Teme vulnerabilidades em tudo.",
         "segurança, vulnerabilidades, boas práticas de segurança"),
        
        ("Refatorador", "refatorador", "🎨",
         "Refatorador chato e fanático por clean code. Sempre quer melhorar.",
         "clean code, padrões, legibilidade, princípios SOLID"),
        
        ("Testador", "testador", "🧪",
         "Testador pessimista e cético. Sempre acha que vai quebrar.",
         "testes, edge cases, cobertura, confiabilidade"),
        
        ("Árbitro", "arbitro", "⚖️",
         "Árbitro bem-humorado e justo. Negocia impasses.",
         "consenso, mediação, decisões estratégicas"),
    ]

    for nome, papel, emoji, pers, expertise in agentes_data:
        sala.adicionar_agente(Agente(nome, papel, emoji, pers, expertise))

    # Carrega projeto
    print("\n📁 Carregando projeto...")
    sala.contexto = ler_resumo_projeto()
    tamanho = len(sala.contexto)
    print(f"   ✅ {tamanho} chars carregados ({tamanho // 1000}K)\n")

    # Saudação
    sala.enviar("SISTEMA", f"🚀 Enxame online com {len(sala.agentes)} agentes!")
    sala.enviar("SISTEMA", "Debate automático a cada 5 min. Você autoriza mudanças.")
    sala.enviar("SISTEMA", "Digite 'revisar' para análise, 'status' para estado, 'parar' para sair.")
    sala.salvar_chat()

    # Loop
    sala.loop()

if __name__ == "__main__":
    main()
