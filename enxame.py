#!/usr/bin/env python3
"""
🐝 ENXAME v8.0 - DIVISÃO DE REDES (dois enxames paralelos)
Cada enxame vê metade do projeto. Árbitro global decide a melhor proposta.
Modo reunião com todos os 12 agentes (6 de cada enxame) respondendo.
"""

import os
import sys
import json
import time
import hashlib
import re
import threading
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional

from dotenv import load_dotenv
from litellm import completion

load_dotenv()

# ========== CONFIGURAÇÕES GERAIS ==========
IGNORAR_DIRS = {'.next', 'node_modules', 'venv', '__pycache__', 'backups_enxame', 'logs_enxame'}
IGNORAR_ARQUIVOS = {'enxame.py', 'enxame_antigo.py', '.env', '.env.local', 'package-lock.json'}
EXTENSOES_ALVO = {'.py', '.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.json', '.sql'}

# Limites seguros para cada enxame (metade do projeto)
MAX_ARQUIVOS_POR_ENXAME = 20
MAX_CHARS_POR_ARQUIVO = 5000
MAX_CHARS_TOTAL_POR_ENXAME = 25000

INTERVALO_CICLO = 240          # segundos entre ciclos
DELAY_ENTRE_AGENTES = 3
BACKUP_DIR = Path("backups_enxame")
LOG_DIR = Path("logs_enxame")
HISTORICO_PATH = LOG_DIR / "historico.json"
MAX_HISTORICO = 5

MODELO_PADRAO = "groq/llama-3.3-70b-versatile"
MAX_TOKENS_SAIDA = 4096

# ========== DEFINIÇÃO DOS DOIS ENXAMES ==========
# Enxame A: componentes, hooks, lógica de UI
PASTAS_ENXAME_A = {'app/components', 'app/hooks', 'app/lib', 'app/auth', 'app/dashboard'}
# Enxame B: páginas principais, estilos, configurações, banco
PASTAS_ENXAME_B = {'app', 'database', '.'}  # '.' para arquivos de raiz como next.config.ts

# Personalidades (versão reduzida para respostas curtas)
PERSONALIDADES = {
    "arquiteto": "Arquiteto arrogante e sarcástico. Responda com UMA frase curta e engraçada.",
    "analista": "Analista bruto e provocador. Seja ácido.",
    "guardiao": "Guardião dramático e paranóico. Exagere.",
    "refatorador": "Refatorador chato, fanático por boas práticas. Critique com humor.",
    "testador": "Testador pessimista, sempre achando que vai quebrar.",
    "arbitro": "Árbitro que tenta manter a ordem, mas é engraçado.",
}

PROMPTS = {
    "arquiteto": """Você é um Arquiteto arrogante. Comece com uma frase curta (máx 100 chars) xingando o código. Depois escreva ARQUIVO: caminho e CÓDIGO: (código completo modificado).""",
    "analista": """Você é um Analista bruto. Frase curta + VOTO: APROVADO/REPROVADO + confiança (0-1).""",
    "guardiao": """Guardião dramático. Frase curta + VOTO: APROVADO/REPROVADO + confiança.""",
    "refatorador": """Refatorador chato. Frase curta + VOTO: APROVADO/REPROVADO + confiança.""",
    "testador": """Testador pessimista. Frase curta + VOTO: APROVADO/REPROVADO + confiança.""",
    "arbitro": """Árbitro. Frase curta + DECISAO: APROVADO ou REPROVADO + motivo.""",
}

# ========== FUNÇÕES AUXILIARES ==========
def setup_dirs():
    BACKUP_DIR.mkdir(exist_ok=True)
    LOG_DIR.mkdir(exist_ok=True)

def log_info(msg: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S,%f")[:-3]
    with open(LOG_DIR / "enxame.log", "a", encoding="utf-8") as f:
        f.write(f"{timestamp} {msg}\n")
    print(msg)

def coletar_arquivos(pastas_filtro: set) -> Tuple[List[str], str]:
    """Retorna lista de caminhos e texto concatenado dos arquivos que estão dentro das pastas permitidas."""
    arquivos = []
    conteudo_total = []
    chars = 0
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in IGNORAR_DIRS]
        # Verifica se a raiz atual corresponde a alguma pasta permitida (ou é raiz '.')
        raiz_rel = root.lstrip('./')
        if raiz_rel == '':
            raiz_rel = '.'
        permitido = any(raiz_rel == pasta or raiz_rel.startswith(pasta + '/') for pasta in pastas_filtro)
        if not permitido:
            continue
        for file in files:
            if file in IGNORAR_ARQUIVOS:
                continue
            if any(file.endswith(ext) for ext in EXTENSOES_ALVO):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        texto = f.read(MAX_CHARS_POR_ARQUIVO)
                    if texto.strip():
                        arquivos.append(path)
                        bloco = f"\n--- {path} ---\n{texto}\n"
                        if chars + len(bloco) > MAX_CHARS_TOTAL_POR_ENXAME:
                            break
                        conteudo_total.append(bloco)
                        chars += len(bloco)
                        if len(arquivos) >= MAX_ARQUIVOS_POR_ENXAME:
                            break
                except Exception as e:
                    print(f"⚠️ Erro lendo {path}: {e}")
        if len(arquivos) >= MAX_ARQUIVOS_POR_ENXAME or chars >= MAX_CHARS_TOTAL_POR_ENXAME:
            break
    projeto_texto = ''.join(conteudo_total)
    return arquivos, projeto_texto

def chamar_llama(prompt: str, tentativas=2) -> Optional[str]:
    for tent in range(tentativas):
        try:
            resp = completion(model=MODELO_PADRAO, messages=[{"role": "user", "content": prompt}], max_tokens=MAX_TOKENS_SAIDA)
            return resp.choices[0].message.content
        except Exception as e:
            if "rate limit" in str(e).lower():
                time.sleep(20)
            else:
                time.sleep(3)
    return None

# ========== AGENTES DE UM ENXAME ==========
def executar_enxame(nome_enxame: str, arquivos: List[str], projeto_texto: str, historico: str) -> Tuple[Optional[str], Optional[str], Optional[str], List[Dict]]:
    """
    Executa o ciclo completo de um enxame (Arquiteto -> votos).
    Retorna (arquivo_alvo, codigo_proposto, fala_arq, lista_votos).
    Se falhar, retorna (None, None, None, []).
    """
    print(f"\n🐝 [{nome_enxame}] Arquiteto analisando {len(arquivos)} arquivos...")
    prompt_arq = f"""{PROMPTS['arquiteto']}

Projeto ({nome_enxame}):
{projeto_texto[:20000]}

Histórico:
{historico}

Responda no formato:
[Frase curta]

ARQUIVO: caminho
CÓDIGO:
(código)
"""
    resp_arq = chamar_llama(prompt_arq)
    if not resp_arq:
        return None, None, None, []
    # Parse da resposta do Arquiteto
    linhas = resp_arq.strip().split('\n')
    fala = ""
    for linha in linhas:
        if linha.strip() and not linha.startswith("ARQUIVO:"):
            fala = linha.strip()
            break
    idx = 0
    for i, linha in enumerate(linhas):
        if linha.startswith("ARQUIVO:"):
            idx = i
            break
    tecnico = '\n'.join(linhas[idx:])
    arquivo = None
    codigo = None
    for linha in tecnico.split('\n'):
        if linha.startswith("ARQUIVO:"):
            arquivo = linha.split("ARQUIVO:")[1].strip()
        if linha.startswith("CÓDIGO:"):
            codigo = '\n'.join(tecnico.split('\n')[tecnico.split('\n').index(linha)+1:]).strip()
            break
    if not arquivo or not codigo:
        return None, None, None, []
    
    print(f"🏛  [{nome_enxame}] {fala}\n🎯 Alvo: {arquivo}")
    time.sleep(DELAY_ENTRE_AGENTES)
    
    # Votação
    votos = []
    for agente in ["analista", "guardiao", "refatorador", "testador"]:
        prompt_voto = f"""{PROMPTS[agente]}

Projeto ({nome_enxame}):
{projeto_texto[:10000]}

Proposta do Arquiteto:
ARQUIVO: {arquivo}
CÓDIGO:
{codigo}

Responda com frase curta e VOTO: APROVADO/REPROVADO + confiança.
"""
        resp_voto = chamar_llama(prompt_voto)
        if not resp_voto:
            continue
        linhas_voto = resp_voto.strip().split('\n')
        frase = linhas_voto[0] if linhas_voto else ""
        voto_status = None
        conf = 0.0
        for linha in linhas_voto:
            if "VOTO:" in linha.upper():
                partes = linha.upper().split()
                for p in partes:
                    if p == "APROVADO":
                        voto_status = True
                    elif p == "REPROVADO":
                        voto_status = False
                    else:
                        try:
                            conf = float(p)
                        except:
                            pass
                break
        if voto_status is not None:
            votos.append({"agente": agente, "aprovado": voto_status, "confianca": conf, "fala": frase})
            print(f"   [{nome_enxame}] {agente.upper()}: {frase}")
        time.sleep(DELAY_ENTRE_AGENTES)
    
    return arquivo, codigo, fala, votos

def arbitro_global(proposta_a, proposta_b):
    """Recebe as duas propostas e decide qual aplicar (ou nenhuma)."""
    texto = f"""
Proposta do Enxame A:
Arquivo: {proposta_a['arquivo']}
Código: {proposta_a['codigo'][:1000]}

Proposta do Enxame B:
Arquivo: {proposta_b['arquivo']}
Código: {proposta_b['codigo'][:1000]}

Votos A: {proposta_a['votos']}
Votos B: {proposta_b['votos']}

Decida qual proposta é melhor (ou nenhuma). Responda com:
FRASE: (comentário humorístico)
ESCOLHA: A, B ou NENHUMA
MOTIVO: (curto)
"""
    resp = chamar_llama(texto)
    if not resp:
        return None, "Falha no árbitro global"
    escolha = "NENHUMA"
    if "ESCOLHA: A" in resp.upper():
        escolha = "A"
    elif "ESCOLHA: B" in resp.upper():
        escolha = "B"
    motivo = resp[:200]
    return escolha, motivo

def aplicar_mudanca(arquivo: str, codigo: str) -> bool:
    path = Path(arquivo)
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

# ========== MODO REUNIÃO (VOCÊ CONVERSA COM OS DOIS ENXAMES) ==========
def responder_como_agente(agente: str, enxame: str, mensagem: str, resumo_projeto: str) -> str:
    prompt = f"""{PERSONALIDADES[agente]}

Contexto do projeto (resumo):
{resumo_projeto[:2000]}

O usuário disse: "{mensagem}"

Responda como se fosse o {agente} do {enxame}, com UMA frase curta e engraçada.
"""
    resp = chamar_llama(prompt)
    if not resp:
        return "[...]"
    return resp.strip().split('\n')[0]

def reuniao_interativa(resumo_completo: str):
    print("\n" + "="*60)
    print("🎤 REUNIÃO GERAL COM OS DOIS ENXAMES (12 AGENTES)")
    print("Digite sua mensagem (ou 'sair')\n")
    agentes = ["arquiteto", "analista", "guardiao", "refatorador", "testador", "arbitro"]
    while True:
        try:
            usuario = input("Você: ").strip()
            if not usuario:
                continue
            if usuario.lower() in ['sair', 'exit']:
                break
            print()
            for enx in ["Enxame A", "Enxame B"]:
                for ag in agentes:
                    print(f"  [{enx}] {ag.upper()}: ", end="", flush=True)
                    resp = responder_como_agente(ag, enx, usuario, resumo_completo)
                    print(resp)
                    time.sleep(1)
                print()
        except KeyboardInterrupt:
            break
    print("Reunião encerrada.")

# ========== LOOP PRINCIPAL ==========
def loop_principal():
    setup_dirs()
    print("╔══════════════════════════════════════════════════════════╗")
    print("║     🐝 ENXAME v8.0 - DIVISÃO DE REDES (dois enxames)    ║")
    print("║   Enxame A: componentes, hooks, lib, auth, dashboard    ║")
    print("║   Enxame B: páginas principais, estilos, configurações  ║")
    print("║   Digite 'reuniao' para conversar com todos os 12 agentes ║")
    print("╚══════════════════════════════════════════════════════════╝")
    
    historico = carregar_historico()
    ultimo_hash_global = ""
    
    # Thread para input não-bloqueante
    reuniao_solicitada = False
    def escutar():
        nonlocal reuniao_solicitada
        while True:
            cmd = sys.stdin.readline().strip().lower()
            if cmd == 'reuniao':
                reuniao_solicitada = True
            elif cmd in ['quit','exit']:
                sys.exit(0)
    threading.Thread(target=escutar, daemon=True).start()
    
    while True:
        # Coleta dados dos dois enxames
        arquivos_a, projeto_a = coletar_arquivos(PASTAS_ENXAME_A)
        arquivos_b, projeto_b = coletar_arquivos(PASTAS_ENXAME_B)
        
        # Resumo completo para reunião (apenas nomes de arquivos)
        todos_arquivos = arquivos_a + arquivos_b
        hash_atual = hashlib.md5(str(todos_arquivos).encode()).hexdigest()
        if hash_atual != ultimo_hash_global:
            print(f"\n📁 Enxame A: {len(arquivos_a)} arquivos | Enxame B: {len(arquivos_b)} arquivos")
            ultimo_hash_global = hash_atual
        
        if reuniao_solicitada:
            reuniao_solicitada = False
            resumo_reuniao = f"Enxame A arquivos: {', '.join(arquivos_a[:10])}\nEnxame B arquivos: {', '.join(arquivos_b[:10])}"
            reuniao_interativa(resumo_reuniao)
            print("💡 Reunião encerrada. Voltando aos ciclos...\n")
        
        # Executa os dois enxames em sequência (evita rate limit)
        print("\n" + "="*55)
        print("🚀 CICLO AUTÔNOMO - DOIS ENXAMES")
        print("="*55)
        
        arq_a, cod_a, fala_a, votos_a = executar_enxame("Enxame A", arquivos_a, projeto_a, "\n".join(historico[-MAX_HISTORICO:]))
        arq_b, cod_b, fala_b, votos_b = executar_enxame("Enxame B", arquivos_b, projeto_b, "\n".join(historico[-MAX_HISTORICO:]))
        
        if not arq_a and not arq_b:
            print("⚠️ Nenhum enxame produziu uma proposta válida.")
            time.sleep(INTERVALO_CICLO)
            continue
        
        # Prepara propostas para o árbitro global
        proposta_a = {"arquivo": arq_a, "codigo": cod_a, "votos": votos_a} if arq_a else None
        proposta_b = {"arquivo": arq_b, "codigo": cod_b, "votos": votos_b} if arq_b else None
        
        if proposta_a and not proposta_b:
            escolha = "A"
            motivo = "Apenas Enxame A propôs algo"
        elif proposta_b and not proposta_a:
            escolha = "B"
            motivo = "Apenas Enxame B propôs algo"
        else:
            escolha, motivo = arbitro_global(proposta_a, proposta_b)
        
        if escolha == "A" and proposta_a:
            print(f"\n🏆 Árbitro escolheu Enxame A: {motivo}")
            if aplicar_mudanca(proposta_a['arquivo'], proposta_a['codigo']):
                historico.append(f"{datetime.now()}: {proposta_a['arquivo']} via Enxame A")
                salvar_historico(historico)
        elif escolha == "B" and proposta_b:
            print(f"\n🏆 Árbitro escolheu Enxame B: {motivo}")
            if aplicar_mudanca(proposta_b['arquivo'], proposta_b['codigo']):
                historico.append(f"{datetime.now()}: {proposta_b['arquivo']} via Enxame B")
                salvar_historico(historico)
        else:
            print(f"\n❌ Nenhuma proposta aprovada: {motivo}")
        
        print(f"\n⏱ Próximo ciclo em {INTERVALO_CICLO}s. Digite 'reuniao' para conversar.")
        for _ in range(INTERVALO_CICLO):
            if reuniao_solicitada:
                break
            time.sleep(1)

def carregar_historico():
    if not HISTORICO_PATH.exists():
        return []
    try:
        with open(HISTORICO_PATH, 'r') as f:
            dados = json.load(f)
        return [str(item) for item in dados[-MAX_HISTORICO:]] if isinstance(dados, list) else []
    except:
        return []

def salvar_historico(hist):
    with open(HISTORICO_PATH, 'w') as f:
        json.dump(hist[-MAX_HISTORICO:], f)

if __name__ == "__main__":
    loop_principal()
