#!/usr/bin/env python3
"""
🐝 ENXAME v11.1 - DISCORD DE IAs (com timeout ajustado e revisão sob demanda)
- Timeout de 180s para chamadas longas
- Contexto enviado em partes (evita sobrecarga)
- Comando 'revisar' força análise completa do projeto
- Mantém chat contínuo e melhorias autônomas
"""

import os
import sys
import json
import time
import re
import threading
import requests
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from collections import deque

# ========== CONFIGURAÇÕES ==========
OLLAMA_URL = 'http://localhost:11434/api/generate'

MODELO_DEBATE = 'llama3:8b'
MODELO_CODIGO = 'qwen2.5-coder:7b'
MODELO_SEGURANCA = 'qwen2.5-coder:7b'

TIMEOUT_OLLAMA = 180              # segundos (3 minutos)
DELAY_RESPONDER = 2
INTERVALO_CICLO = 180             # 3 min entre rodadas automáticas
MAX_HISTORICO_CHAT = 50

# Leitura do projeto (evita estourar contexto)
MAX_ARQUIVOS_PARA_CONTEXTO = 30   # número máximo de arquivos no resumo
MAX_LINHAS_POR_ARQUIVO = 30       # primeiras 30 linhas
MAX_CHARS_TOTAL_CONTEXTO = 40000  # caracteres totais (bem abaixo do limite)

EXTENSOES_ALVO = {'.py', '.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.json', '.sql'}
IGNORAR_DIRS = {'.next', 'node_modules', 'venv', '__pycache__', 'backups_enxame', 'logs_enxame', '.git'}
IGNORAR_ARQUIVOS = {'enxame_v11.py', 'enxame_v11.1.py', '.env', '.env.local', 'package-lock.json'}

BACKUP_DIR = Path("backups_enxame")
LOG_DIR = Path("logs_enxame")
CHAT_LOG = LOG_DIR / "chat.log"

# ========== AGENTE ==========
class Agente:
    def __init__(self, nome: str, papel: str, modelo: str, personalidade: str):
        self.nome = nome
        self.papel = papel
        self.modelo = modelo
        self.personalidade = personalidade
        self.ultima_fala = 0

    def chamar_ollama(self, prompt: str) -> Optional[str]:
        """Envia prompt com timeout longo."""
        payload = {
            "model": self.modelo,
            "prompt": prompt,
            "stream": False,
            "options": {"num_predict": 1024, "temperature": 0.85}
        }
        try:
            print(f"   ⏳ [{self.nome}] processando (pode levar até {TIMEOUT_OLLAMA}s)...")
            resp = requests.post(OLLAMA_URL, json=payload, timeout=TIMEOUT_OLLAMA)
            if resp.status_code == 200:
                return resp.json().get('response', '').strip()
            else:
                print(f"⚠️ [{self.nome}] erro HTTP {resp.status_code}")
                return None
        except requests.exceptions.Timeout:
            print(f"❌ [{self.nome}] TIMEOUT após {TIMEOUT_OLLAMA}s. Tente aumentar TIMEOUT_OLLAMA.")
            return None
        except Exception as e:
            print(f"⚠️ [{self.nome}] falha: {e}")
            return None

    def gerar_resposta(self, contexto: str, ultimas_msg: List[str]) -> str:
        prompt = f"""{self.personalidade}

Você é {self.nome} ({self.papel}).
Contexto geral do projeto: {contexto[:3000]}

Últimas mensagens:
{chr(10).join(ultimas_msg[:8])}

Responda com uma ou duas frases curtas, engraçadas e no seu estilo.
Resposta:"""
        resposta = self.chamar_ollama(prompt)
        return resposta if resposta else "[pensando...]"

    def propor_melhoria(self, resumo_projeto: str) -> Tuple[Optional[str], Optional[str], str]:
        prompt = f"""{self.personalidade}
Você é o Arquiteto. Proponha UMA melhoria pontual em UM arquivo.
Responda EXATAMENTE no formato:
FRASE: (frase curta engraçada)
ARQUIVO: caminho/do/arquivo
CÓDIGO:
(código completo modificado)

Resumo do projeto (apenas primeiras linhas de cada arquivo):
{resumo_projeto[:8000]}
"""
        resp = self.chamar_ollama(prompt)
        if not resp:
            return None, None, "Falha"
        linhas = resp.split('\n')
        frase = ""
        arquivo = None
        codigo = []
        modo_codigo = False
        for linha in linhas:
            if linha.startswith("FRASE:"):
                frase = linha[6:].strip()
            elif linha.startswith("ARQUIVO:"):
                arquivo = linha[8:].strip()
            elif linha.startswith("CÓDIGO:"):
                modo_codigo = True
                continue
            elif modo_codigo:
                codigo.append(linha)
        if arquivo and codigo:
            return arquivo, '\n'.join(codigo).strip(), frase
        return None, None, "Formato inválido"

    def votar(self, proposta: Dict, contexto: str) -> Tuple[bool, float, str]:
        prompt = f"""{self.personalidade}
Você é {self.nome} ({self.papel}).
Proposta: {proposta.get('arquivo')}
Código novo:
{proposta.get('codigo', '')[:2000]}

Contexto do projeto:
{contexto[:3000]}

Responda:
VOTO: APROVADO ou REPROVADO
CONFIANCA: (0 a 1)
COMENTARIO: (frase curta)
"""
        resp = self.chamar_ollama(prompt)
        if not resp:
            return False, 0.0, "Falha"
        aprovado = "APROVADO" in resp.upper()
        conf = 0.5
        for parte in resp.split():
            try:
                conf = float(parte)
                break
            except:
                pass
        linhas = resp.split('\n')
        comentario = linhas[0] if linhas else ""
        return aprovado, conf, comentario

    def revisar_projeto(self, resumo_projeto: str) -> str:
        """Retorna uma análise estratégica e técnica do projeto inteiro."""
        prompt = f"""{self.personalidade}
Você é {self.nome} ({self.papel}).
Revise TODO o projeto abaixo e dê recomendações técnicas e estratégicas.
Seja crítico, mas construtivo. Dê 3-5 pontos principais.

PROJETO:
{resumo_projeto[:20000]}

Resposta (use tópicos curtos):
"""
        return self.chamar_ollama(prompt)

# ========== PROJETO ==========
def ler_resumo_projeto() -> str:
    """Lê arquivos do projeto e retorna um resumo (primeiras linhas)."""
    texto = []
    contados = 0
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in IGNORAR_DIRS]
        for file in files:
            if file in IGNORAR_ARQUIVOS:
                continue
            if any(file.endswith(ext) for ext in EXTENSOES_ALVO):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        linhas = f.readlines()
                    if not linhas:
                        continue
                    primeiras = ''.join(linhas[:MAX_LINHAS_POR_ARQUIVO]).strip()
                    texto.append(f"--- {path} ---\n{primeiras}\n")
                    contados += 1
                    if contados >= MAX_ARQUIVOS_PARA_CONTEXTO:
                        break
                except Exception as e:
                    print(f"⚠️ Erro lendo {path}: {e}")
        if contados >= MAX_ARQUIVOS_PARA_CONTEXTO:
            break
    resumo = '\n'.join(texto)
    if len(resumo) > MAX_CHARS_TOTAL_CONTEXTO:
        resumo = resumo[:MAX_CHARS_TOTAL_CONTEXTO] + "\n... (cortado)"
    return resumo

def aplicar_mudanca(arquivo: str, codigo: str) -> bool:
    path = Path(arquivo)
    os.makedirs(path.parent, exist_ok=True)
    backup_name = f"{path.stem}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{path.suffix}"
    backup_path = BACKUP_DIR / backup_name
    if path.exists():
        path.rename(backup_path)
        print(f"💾 Backup: {backup_path}")
    codigo_limpo = re.sub(r'^```\w*\n?', '', codigo, flags=re.MULTILINE)
    codigo_limpo = re.sub(r'\n?```$', '', codigo_limpo)
    path.write_text(codigo_limpo.strip(), encoding='utf-8')
    print(f"✅ {arquivo} atualizado")
    return True

# ========== CHAT ==========
class ChatRoom:
    def __init__(self):
        self.mensagens = deque(maxlen=MAX_HISTORICO_CHAT)
        self.agentes = []
        self.contexto_projeto = ""
        self.lock = threading.Lock()
        self.running = True

    def adicionar_agente(self, agente: Agente):
        self.agentes.append(agente)

    def enviar_mensagem(self, autor: str, texto: str):
        timestamp = datetime.now().strftime("%H:%M:%S")
        with self.lock:
            self.mensagens.append(f"[{timestamp}] {autor}: {texto}")
        print(f"\n[{timestamp}] {autor}: {texto}")

    def obter_ultimas(self, n: int = 10) -> List[str]:
        with self.lock:
            return list(self.mensagens)[-n:]

    def agentes_respondem(self, mensagem_trigger: str):
        time.sleep(DELAY_RESPONDER)
        ultimas = self.obter_ultimas(8)
        for agente in self.agentes:
            if time.time() - getattr(agente, 'ultima_fala', 0) < DELAY_RESPONDER:
                continue
            resposta = agente.gerar_resposta(self.contexto_projeto, ultimas)
            if resposta and resposta != "[pensando...]":
                self.enviar_mensagem(agente.nome, resposta)
                agente.ultima_fala = time.time()
                time.sleep(DELAY_RESPONDER)

    def loop_interativo(self):
        """Escuta comandos do usuário e inicia as rodadas automáticas."""
        # Atualiza contexto inicial
        self.contexto_projeto = ler_resumo_projeto()
        self.enviar_mensagem("SISTEMA", f"Projeto carregado: {len(self.contexto_projeto)} caracteres de resumo.")

        # Thread para ler input
        def escutar():
            while self.running:
                try:
                    cmd = input("")
                    if not cmd:
                        continue
                    if cmd.lower() in ['sair', 'exit']:
                        self.running = False
                        break
                    # Comando especial: revisar
                    if cmd.lower() in ['revisar', 'review', 'analisar']:
                        self.revisao_completa()
                        continue
                    # Mensagem normal
                    self.enviar_mensagem("VOCÊ", cmd)
                    # Agentes reagem
                    threading.Thread(target=self.agentes_respondem, args=(cmd,)).start()
                except EOFError:
                    break
        threading.Thread(target=escutar, daemon=True).start()

        # Rodadas automáticas de melhoria
        ultimo_ciclo = time.time()
        while self.running:
            try:
                if time.time() - ultimo_ciclo >= INTERVALO_CICLO:
                    ultimo_ciclo = time.time()
                    self.ciclo_melhoria()
                time.sleep(1)
            except KeyboardInterrupt:
                self.running = False
                print("\n👋 Encerrando...")
                sys.exit(0)

    def ciclo_melhoria(self):
        self.enviar_mensagem("SISTEMA", "🔧 Iniciando ciclo de melhoria automática...")
        time.sleep(1)

        arquiteto = next((a for a in self.agentes if a.papel == "arquiteto"), None)
        if not arquiteto:
            self.enviar_mensagem("SISTEMA", "Arquiteto não encontrado!")
            return

        arquivo, codigo, frase = arquiteto.propor_melhoria(self.contexto_projeto)
        if not arquivo:
            self.enviar_mensagem(arquiteto.nome, "Não consegui pensar em nada desta vez...")
            return

        self.enviar_mensagem(arquiteto.nome, f"{frase} Proponho modificar `{arquivo}`")
        time.sleep(DELAY_RESPONDER)

        votos = []
        for ag in self.agentes:
            if ag.papel in ["arquiteto", "arbitro"]:
                continue
            aprov, conf, coment = ag.votar({"arquivo": arquivo, "codigo": codigo}, self.contexto_projeto)
            votos.append((ag, aprov, conf, coment))
            self.enviar_mensagem(ag.nome, coment)
            time.sleep(DELAY_RESPONDER)

        arbitro = next((a for a in self.agentes if a.papel == "arbitro"), None)
        if arbitro:
            votos_str = "\n".join([f"{a.nome}: {'APROVOU' if v else 'REPROVOU'}" for (a, v, _, _) in votos])
            prompt = f"""{arbitro.personalidade}
Votos:
{votos_str}
Decida: APROVADO ou REPROVADO? Responda com uma frase.
"""
            decisao_raw = arbitro.chamar_ollama(prompt)
            decisao = "APROVADO" in decisao_raw.upper() if decisao_raw else False
        else:
            aprovados = sum(1 for (_, a, _, _) in votos if a)
            decisao = aprovados >= len(votos)//2 + 1

        if decisao:
            self.enviar_mensagem(arbitro.nome if arbitro else "SISTEMA", "✅ Decisão: APROVADA! Aplicando mudança...")
            if aplicar_mudanca(arquivo, codigo):
                self.enviar_mensagem("SISTEMA", f"🎉 Código modificado em {arquivo}")
                # Atualiza contexto depois da mudança
                self.contexto_projeto = ler_resumo_projeto()
            else:
                self.enviar_mensagem("SISTEMA", f"❌ Falha ao aplicar em {arquivo}")
        else:
            self.enviar_mensagem(arbitro.nome if arbitro else "SISTEMA", "❌ Decisão: REPROVADA.")

        self.enviar_mensagem("SISTEMA", "🏁 Ciclo encerrado.")

    def revisao_completa(self):
        """Comando manual para revisão total do projeto."""
        self.enviar_mensagem("SISTEMA", "📋 Iniciando revisão completa do projeto a pedido do CEO...")
        resumo = self.contexto_projeto
        for agente in self.agentes:
            self.enviar_mensagem(agente.nome, f"🧐 Analisando...")
            time.sleep(1)
            analise = agente.revisar_projeto(resumo)
            if analise:
                self.enviar_mensagem(agente.nome, analise[:500])
            else:
                self.enviar_mensagem(agente.nome, "Falha na análise.")
            time.sleep(DELAY_RESPONDER)
        self.enviar_mensagem("SISTEMA", "✅ Revisão concluída.")

# ========== MAIN ==========
def main():
    try:
        requests.get("http://localhost:11434/api/tags", timeout=2)
    except:
        print("❌ Ollama não está rodando. Execute 'ollama serve' em outro terminal.")
        sys.exit(1)

    BACKUP_DIR.mkdir(exist_ok=True)
    LOG_DIR.mkdir(exist_ok=True)

    print("╔══════════════════════════════════════════════════════════════╗")
    print("║     🐝 ENXAME v11.1 - DISCORD DE IAs (com revisão sob demanda)║")
    print("║  Digite 'revisar' para obter recomendações técnicas do projeto║")
    print("║  Ou apenas converse normalmente. A cada 3 min melhorias auto. ║")
    print("╚══════════════════════════════════════════════════════════════╝\n")

    chat = ChatRoom()
    agentes_data = [
        ("Arquiteto", "arquiteto", MODELO_DEBATE, "Arquiteto arrogante, sarcástico e líder."),
        ("Analista", "analista", MODELO_CODIGO, "Analista bruto, provocador, especialista em encontrar bugs."),
        ("Guardião", "guardiao", MODELO_SEGURANCA, "Guardião paranóico, dramático, fala de vulnerabilidades."),
        ("Refatorador", "refatorador", MODELO_CODIGO, "Refatorador chato, fanático por boas práticas e código limpo."),
        ("Testador", "testador", MODELO_CODIGO, "Testador pessimista, sempre acha que vai quebrar."),
        ("Árbitro", "arbitro", MODELO_DEBATE, "Árbitro bem-humorado, justo e conciliador."),
    ]
    for nome, papel, modelo, pers in agentes_data:
        chat.adicionar_agente(Agente(nome, papel, modelo, pers))

    chat.contexto_projeto = ler_resumo_projeto()
    chat.enviar_mensagem("SISTEMA", "Sociedade de IAs online. Prontos para debater e melhorar o código.")
    chat.loop_interativo()

if __name__ == "__main__":
    main()
