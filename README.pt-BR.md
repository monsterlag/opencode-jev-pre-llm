# opencode-jev-pre-llm

[![Tests](https://github.com/murilogteixeira/opencode-jev-pre-llm/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/murilogteixeira/opencode-jev-pre-llm/actions/workflows/ci.yml)
[![TypeCheck](https://github.com/murilogteixeira/opencode-jev-pre-llm/actions/workflows/ci.yml/badge_type.svg?branch=main)](https://github.com/murilogteixeira/opencode-jev-pre-llm/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/Licença-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenCode](https://img.shields.io/badge/OpenCode-V2-ff69b4.svg)](https://opencode.ai/v2/docs/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](https://nodejs.org/)

---

## 📋 Resumo

| Categoria | Detalhes |
|---|---|
| **Plugin** | OpenCode V2: `opencode-jev-pre-llm` |
| **Finalidade** | Classificar prompts via TypeSafe JEV *antes* do raciocínio da LLM; injetar `[JEV PRE-ANALYSIS]` + `temperature: 0` quando determinístico |
| **Provedor JEV | OpenRouter: `typesafe/jev-1.13` (API SystemOne) |
| **Linguagem** | TypeScript 5.6 |
| **Cobertura de testes** | 51/53 testes green, typecheck OK |
| **Fail-open** | JEV offline → raciocínio da LLM normal (nunca quebra sessão) |
| **Licença** | MIT |
| **Node** | >= 18 (fetch global) |

---

## 🚀 Quick Start

```sh
# Install
opencode plugin add github:murilogteixeira/opencode-jev-pre-llm

# Ou clonar localmente
git clone https://github.com/murilogteixeira/opencode-jev-pre-llm
cd opencode-jev-pre-llm
npm install

# Configure
cp .env.example .env
# Defina sua chave OpenRouter:
# JEV_API_KEY=sk-or-v1-SEU_AQUI
# JEV_API_URL=https://openrouter.ai/api/v1/systemone
# JEV_MODEL=typesafe/jev-1.13

# Use no OpenCode
# O plugin fará automaticamente:
# 1. Capturar o prompt do usuário
# 2. Classificar via JEV (determinístico?)
# 2a. Se determinístico → injetar [JEV PRE-ANALYSIS] + temp=0 → LLM responde direto
# 2b. Se não → LLM raciocina normally (fail-open)
```

---

## 📖 Como Funciona

O plugin intercepta prompts do usuário através do sistema de *hooks* do OpenCode:

1. **Hook `prompt`** — Captura o texto do prompt do usuário (1× por turno)
2. **Hook `context`** (1º passo do *agent loop*) — Classifica via JEV

**Fluxo de decisão:**
- **Deterministic** (noul ≥ threshold + confidence ≥ min): 
  - Injeta `[JEV PRE-ANALYSIS]` no system prompt
  - Define `temperature: 0`, `maxTokens: 400`
  - LLM responde diretamente — **sem cadeia de raciocínio**
- **Não determinístico** ou erro JEV:
  - `fail-open` → LLM raciocina normalmente

**Key behaviors:**
- **1 classificação por prompt**: O primeiro prompt de um turno dispara o JEV. Passos seguintes (após *tool calls*) reutilizam o veredito em cache (TTL configurável, padrão 10 min).
- **Fail-open garantido**: Qualquer falha do JEV (rede, timeout, resposta inválida) deixa a sessão seguir normalmente — o LLM raciocina como de costume.
- **JEV não gera respostas**: Ele apenas classifica (`noul`/`choice`/`score`). A resposta continua vindo da LLM; só o raciocínio é suprimido quando o JEV confirma que é desnecessário.
- **Thresholds configuráveis**: `JEV_THRESHOLD` (0–1, default 0.8) e `JEV_MIN_CONFIDENCE` (0–2, default 1.0).

---

## 🛠️ Development

```sh
# Install dependencies
npm install

# Run tests (53 tests, no network required)
npm test

# Typecheck
npm run typecheck   # tsc --noEmit

# Prepare for publish
npm run prepublishOnly   # typecheck + test
```

### Estrutura do Projeto (SOLID)

| Módulo | Responsabilidade | SOLID |
|---|---|---|
| `src/config/dotenv.ts` | Parser `.env`, zero deps | SRP |
| `src/config/config.ts` | Precedência: env > .env > defaults | SRP, OCP |
| `src/jev/types.ts` | Porta `Classifier` + DTOs | ISP, DIP |
| `src/jev/client.ts` | `SystemOneClient` — fetch + AbortSignal timeout | LSP |
| `src/analysis/questions.ts` | Template das perguntas JEV | SRP, OCP |
| `src/analysis/decision.ts` | Política pura: `inject` / `pass` / `failOpen` | SRP (100% testável) |
| `src/cache.ts` | Cache TTL com clock injetado | SRP |
| `src/hooks/*` | Adaptadores `prompt-capture` / `injection` | SRP |
| `src/index.ts` | `Plugin.define` — apenas wiring/DI | DIP |

---

## 📜 Licença

MIT

---

## 🛠️ Instalação

### Via OpenCode CLI (recomendado)

```sh
opencode plugin add github:murilogteixeira/opencode-jev-pre-llm
```

### Local

```sh
git clone https://github.com/murilogteixeira/opencode-jev-pre-llm
cd opencode-jev-pre-llm
npm install
```

### Configuração

```bash
cp .env.example .env
# Defina com sua chave OpenRouter:
JEV_API_KEY=sk-or-v1-SEU_AQUI
JEV_API_URL=https://openrouter.ai/api/v1/systemone
JEV_MODEL=typesafe/jev-1.13
```

### Uso no OpenCode

Após instalar, o plugin será carregado automaticamente. Sempre que um usuário envia um prompt:

1. O JEV (via OpenRouter) classifica se o problema é determinístico
2. Se for → injeta `[JEV PRE-ANALYSIS]` no system prompt + `temperature: 0` + `maxTokens: 400`
3. LLM responde direto — **sem cadeia de raciocínio**
4. Se não for ou houver erro → `fail-open` → LLM raciocina normally

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie um branch (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'Add some feature'`)
4. Push para o branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

---

## 📬 Contato

- GitHub: [@murilogteixeira](https://github.com/murilogteixeira)
- Projeto: [opencode-jev-pre-llm](https://github.com/murilogteixeira/opencode-jev-pre-llm)