#!/usr/bin/env python3
"""
🐝 ENXAME v13.2 SMART — Lê pastas importantes PRIMEIRO
"""

import os, sys, json, time, re, threading
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from collections import deque
from dataclasses import dataclass, field, asdict
from dotenv import load_dotenv
from litellm import completion

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("❌ ERRO: Configure GROQ_API_KEY no .env")
    sys.exit(1)

os.environ["GROQ_API_KEY"] = GROQ_API_KEY

GROQ_MODEL = "groq/llama-3.3-70b-versatile"
MAX_TOKENS = 512
TEMPERATURE = 0.7
TIMEOUT_API = 20
MAX_RETRIES = 2
RETRY_DELAY = 1

EXTENSOES_ALVO = {'.py', '.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.json', '.sql', '.md'}
IGNORAR_DIRS = {'.next', 'node_modules', 'venv', '__pycache__', 'backups_enxame', 'logs_enxame', '.git', '.vercel', 'dist', 'build'}
IGNORAR_ARQUIVOS = {'enxame_v13_2_smart.py', '.env', '.env.local', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'}

# PRIORIDADE DE PASTAS (as que os agentes devem ver PRIMEIRO)
PASTAS_PRIORITARIAS = ['app', 'auth', 'hooks', 'lib', 'components', 'src']
MAX_LINHAS_POR_ARQUIVO = 20
MAX_CHARS_RESUMO = 30000  # Aumentou um pouco

BACKUP_DIR = Path("backups_enxame")
LOG_DIR = Path("logs_enxame")
INTERVALO_CICLO_MIN = 300

@dataclass
class Voto:
    agente: str
    aprovado: bool
    confianca: float
    comentario: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

@dataclass
class Proposta:
    arquivo: str
    codigo: str
    descricao: str
    prioridade: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    votos: List[Voto] = field(default_factory=list)
    aplicada: bool = False

class Agente:
    def __init__(self, nome: str, papel: str, emoji: str, personalidade: str, expertise: str):
        self.nome = nome
        self.papel = papel
        self.emoji = emoji
        self.personalidade = personalidade
        self.expertise = expertise
        self.ultima_fala = 0
        self.msgs_enviadas = 0
        self.votos_totais = 0
        self.cache = {}

    def chamar_groq(self, prompt: str, tentativa: int = 0) -> Optional[str]:
        prompt_hash = str(hash(prompt[:200]))
        if prompt_hash in self.cache:
            return self.cache[prompt_hash]
        try:
            resp = completion(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=MAX_TOKENS,
                temperature=TEMPERATURE,
                timeout=TIMEOUT_API
            )
            resultado = resp.choices[0].message.content.strip()
            if resultado:
                self.cache[prompt_hash] = resultado
            return resultado if resultado else None
        except Exception as e:
            if tentativa < MAX_RETRIES:
                time.sleep(RETRY_DELAY * (tentativa + 1))
                return self.chamar_groq(prompt, tentativa + 1)
            return None

    def responder_naturalmente(self, ultimas_msg: List[str]) -> str:
        prompt = f"""Você é {self.nome}. 1 frase curta (máx 15 palavras).
Última msg: {ultimas_msg[-1] if ultimas_msg else 'nada'}
Resposta:"""
        return self.chamar_groq(prompt) or f"{self.emoji} [...]"

    def analisar_projeto(self, resumo: str) -> str:
        prompt = f"""Você é {self.nome} ({self.expertise}).
Maior problema em 1 linha (50 palavras máx):
{resumo[:5000]}
Resposta:"""
        return self.chamar_groq(prompt) or "Sem análise"

    def propor_melhoria(self, resumo: str, problema: str) -> Optional[Dict]:
        prompt = f"""Arquiteto propõe UMA mudança.
Problema: {problema[:150]}
Código: {resumo[:4000]}
ARQUIVO: [caminho]
DESCRICAO: [1 linha]
CODIGO:
[código]
Responda EXATAMENTE assim:"""
        resp = self.chamar_groq(prompt)
        if not resp:
            return None
        arquivo_match = re.search(r'ARQUIVO:\s*(.+?)(?:\n|$)', resp)
        codigo_match = re.search(r'```[\w]*\n(.*?)\n```', resp, re.DOTALL)
        if not arquivo_match or not codigo_match:
            return None
        return {
            "arquivo": arquivo_match.group(1).strip(),
            "descricao": "Melhoria",
            "prioridade": "média",
            "codigo": codigo_match.group(1).strip()
        }

    def opinar(self, proposta: Dict) -> str:
        prompt = f"""Você é {self.nome}.
Proposta: {proposta['descricao']}
Opinião (2 frases máx):"""
        return self.chamar_groq(prompt) or "[sem opinião]"

    def votar(self, proposta: Dict) -> Tuple[bool, float, str]:
        prompt = f"""Você é {self.nome}.
Proposta: {proposta['descricao']}
VOTO: APROVADO/REPROVADO, 0.5-1.0, motivo curto."""
        resp = self.chamar_groq(prompt)
        if not resp:
            return False, 0.5, "sem resposta"
        aprovado = "APROVADO" in resp.upper()
        confianca = 0.8 if aprovado else 0.6
        return aprovado, confianca, resp[:60]

def ler_resumo_projeto_smart() -> str:
    """
    Lê arquivos PRIORIZANDO pastas importantes.
    1º: app, auth, hooks, lib, components
    2º: resto do projeto
    """
    print("  📂 Lendo projeto com priorização...")
    
    # Dict para organizar por pasta
    arquivos_por_pasta = {}
    
    # VARREDURA 1: Pastas prioritárias
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in IGNORAR_DIRS]
        
        # Verifica se está em pasta prioritária
        em_pasta_prioritaria = False
        for pasta_prio in PASTAS_PRIORITARIAS:
            if root.startswith(f"./{pasta_prio}") or root == f"./{pasta_prio}":
                em_pasta_prioritaria = True
                break
        
        if not em_pasta_prioritaria:
            continue
        
        for file in sorted(files):
            if file in IGNORAR_ARQUIVOS or not any(file.endswith(e) for e in EXTENSOES_ALVO):
                continue
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    linhas = f.readlines()[:MAX_LINHAS_POR_ARQUIVO]
                if linhas:
                    conteudo = ''.join(linhas).strip()
                    # Organiza por pasta
                    pasta = root.split('/')[1] if '/' in root else 'root'
                    if pasta not in arquivos_por_pasta:
                        arquivos_por_pasta[pasta] = []
                    arquivos_por_pasta[pasta].append(f"📄 {path}\n{conteudo}\n")
            except:
                pass
    
    # VARREDURA 2: Resto do projeto
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in IGNORAR_DIRS]
        
        # Pula pastas prioritárias nessa volta
        em_pasta_prioritaria = False
        for pasta_prio in PASTAS_PRIORITARIAS:
            if root.startswith(f"./{pasta_prio}") or root == f"./{pasta_prio}":
                em_pasta_prioritaria = True
                break
        
        if em_pasta_prioritaria:
            continue
        
        for file in sorted(files):
            if file in IGNORAR_ARQUIVOS or not any(file.endswith(e) for e in EXTENSOES_ALVO):
                continue
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    linhas = f.readlines()[:MAX_LINHAS_POR_ARQUIVO]
                if linhas:
                    conteudo = ''.join(linhas).strip()
                    pasta = root.split('/')[1] if '/' in root else 'root'
                    if pasta not in arquivos_por_pasta:
                        arquivos_por_pasta[pasta] = []
                    arquivos_por_pasta[pasta].append(f"📄 {path}\n{conteudo}\n")
            except:
                pass
    
    # Monta resumo respeitando prioridade
    resumo_parts = []
    
    # Primeiro: pastas prioritárias
    for pasta in PASTAS_PRIORITARIAS:
        if pasta in arquivos_por_pasta:
            resumo_parts.append(f"\n🔥 PASTA: {pasta.upper()}\n" + ''.join(arquivos_por_pasta[pasta]))
    
    # Depois: resto
    for pasta, arquivos in sorted(arquivos_por_pasta.items()):
        if pasta not in PASTAS_PRIORITARIAS:
            resumo_parts.append(f"\n📁 PASTA: {pasta}\n" + ''.join(arquivos))
    
    resumo = ''.join(resumo_parts)
    
    # Corta se muito grande, mas mantém as partes importantes
    if len(resumo) > MAX_CHARS_RESUMO:
        resumo = resumo[:MAX_CHARS_RESUMO] + "\n\n... (demais caracteres — pastas importantes foram lidas)"
    
    total_chars = len(resumo)
    total_pastas = len(arquivos_por_pasta)
    print(f"  ✅ {total_chars} chars | {total_pastas} pastas lidas")
    
    return resumo

def aplicar_mudanca(arquivo: str, codigo: str) -> bool:
    path = Path(arquivo)
    if ".." in arquivo or arquivo.startswith("/"):
        print(f"  ❌ Suspeito: {arquivo}")
        return False
    BACKUP_DIR.mkdir(exist_ok=True)
    if path.exists():
        backup = BACKUP_DIR / f"{path.stem}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{path.suffix}"
        path.rename(backup)
    codigo_limpo = re.sub(r'^```[\w]*\n?', '', codigo, flags=re.MULTILINE)
    codigo_limpo = re.sub(r'\n?```$', '', codigo_limpo).strip()
    if arquivo.endswith('.py'):
        try:
            compile(codigo_limpo, arquivo, 'exec')
        except SyntaxError:
            return False
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(codigo_limpo, encoding='utf-8')
        print(f"  ✅ {arquivo}")
        return True
    except:
        return False

class SalaChat:
    def __init__(self):
        self.mensagens = deque(maxlen=100)
        self.agentes: List[Agente] = []
        self.contexto = ""
        self.lock = threading.Lock()
        self.running = True
        self.proposta_pendente: Optional[Proposta] = None
        self.proximo_ciclo = time.time() + INTERVALO_CICLO_MIN
        BACKUP_DIR.mkdir(exist_ok=True)
        LOG_DIR.mkdir(exist_ok=True)

    def adicionar_agente(self, agente: Agente):
        self.agentes.append(agente)

    def enviar(self, autor: str, texto: str):
        ts = datetime.now().strftime("%H:%M:%S")
        with self.lock:
            self.mensagens.append({"ts": ts, "autor": autor, "texto": texto})
        print(f"[{ts}] {autor}: {texto}")

    def agentes_conversam(self):
        time.sleep(0.3)
        for agente in self.agentes[:2]:
            if time.time() - agente.ultima_fala < 1:
                continue
            resposta = agente.responder_naturalmente(list(self.mensagens)[-2:])
            if resposta:
                self.enviar(f"{agente.emoji} {agente.nome}", resposta)
                agente.ultima_fala = time.time()
                time.sleep(0.5)

    def ciclo_melhoria(self) -> bool:
        print("\n" + "═"*50)
        print(f"  🚀 Ciclo {len(self.agentes)} — {datetime.now().strftime('%H:%M')}")
        print("═"*50)

        arquiteto = next((a for a in self.agentes if a.papel == "arquiteto"), None)
        if not arquiteto:
            return False
        
        analise = arquiteto.analisar_projeto(self.contexto)
        print(f"  Análise: {analise[:80]}...")
        self.enviar(f"{arquiteto.emoji} {arquiteto.nome}", f"🔍 {analise[:100]}")
        time.sleep(0.8)

        melhoria = arquiteto.propor_melhoria(self.contexto, analise)
        if not melhoria:
            print("  ❌ Sem proposta")
            return False

        proposta = Proposta(
            arquivo=melhoria['arquivo'],
            codigo=melhoria['codigo'],
            descricao=melhoria['descricao'],
            prioridade=melhoria['prioridade']
        )
        self.enviar(f"{arquiteto.emoji} {arquiteto.nome}", f"✨ {proposta.arquivo}")
        time.sleep(0.8)

        votos_sim = 0
        print("  Votos:")
        for agente in self.agentes:
            if agente.papel == "arquiteto":
                continue
            aprovado, confianca, motivo = agente.votar(asdict(proposta))
            proposta.votos.append(Voto(agente.nome, aprovado, confianca, motivo))
            status = "✅" if aprovado else "❌"
            print(f"    {status} {agente.nome}")
            if aprovado:
                votos_sim += 1
            time.sleep(0.3)

        resultado = votos_sim > len(proposta.votos) / 2
        print(f"  Resultado: {votos_sim}/{len(proposta.votos)}")

        if resultado:
            self.proposta_pendente = proposta
            self.enviar("SISTEMA", "✅ APROVADA! Digite 'aplicar'")
        else:
            self.enviar("SISTEMA", "❌ Rejeitada")

        print("═"*50)
        return resultado

    def executar_aplicacao(self) -> bool:
        if not self.proposta_pendente:
            self.enviar("SISTEMA", "❌ Nenhuma proposta")
            return False
        self.enviar("SISTEMA", f"🔨 Aplicando...")
        if aplicar_mudanca(self.proposta_pendente.arquivo, self.proposta_pendente.codigo):
            self.proposta_pendente.aplicada = True
            self.enviar("SISTEMA", "🎉 APLICADA!")
            self.contexto = ler_resumo_projeto_smart()
            self.proposta_pendente = None
            return True
        return False

    def loop(self):
        def escutar():
            while self.running:
                try:
                    cmd = input().strip().lower()
                    if not cmd:
                        continue
                    if cmd in ['sair', 'exit', 'parar']:
                        self.running = False
                        break
                    elif cmd == 'aplicar':
                        self.executar_aplicacao()
                    else:
                        self.enviar("VOCÊ", cmd)
                        threading.Thread(target=self.agentes_conversam, daemon=True).start()
                except EOFError:
                    self.running = False
                    break

        threading.Thread(target=escutar, daemon=True).start()
        while self.running:
            if time.time() >= self.proximo_ciclo:
                self.ciclo_melhoria()
                self.proximo_ciclo = time.time() + INTERVALO_CICLO_MIN
            time.sleep(0.5)
        print("\n✅ Finalizado.")

def main():
    print("""
╔════════════════════════════════════════════════════════════╗
║   🐝 ENXAME v13.2 SMART — Prioriza pastas importantes     ║
║   COMANDOS: aplicar | parar                               ║
╚════════════════════════════════════════════════════════════╝
    """)

    sala = SalaChat()
    agentes_data = [
        ("Arquiteto", "arquiteto", "🏛️", "Perfeccionista", "arquitetura"),
        ("Analista", "analista", "🔍", "Paranóico", "bugs"),
        ("Guardião", "guardiao", "🔐", "Dramático", "segurança"),
        ("Refatorador", "refatorador", "🎨", "Fanático", "clean code"),
        ("Testador", "testador", "🧪", "Pessimista", "testes"),
        ("Árbitro", "arbitro", "⚖️", "Equilibrado", "consenso"),
    ]

    for nome, papel, emoji, pers, exp in agentes_data:
        sala.adicionar_agente(Agente(nome, papel, emoji, pers, exp))

    print("\n📁 Carregando com PRIORIZAÇÃO...")
    sala.contexto = ler_resumo_projeto_smart()
    print()

    sala.enviar("SISTEMA", "🚀 Online! Ciclos a cada 5 min.")
    sala.loop()

if __name__ == "__main__":
    main()
