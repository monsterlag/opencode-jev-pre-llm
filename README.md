# opencode-jev-pre-llm

[![Tests](https://github.com/murilogteixeira/opencode-jev-pre-llm/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/murilogteixeira/opencode-jev-pre-llm/actions/workflows/ci.yml)
[![TypeCheck](https://github.com/murilogteixeira/opencode-jev-pre-llm/actions/workflows/ci.yml/badge_type.svg?branch=main)](https://github.com/murilogteixeira/opencode-jev-pre-llm/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenCode](https://img.shields.io/badge/OpenCode-V2-ff69b4.svg)](https://opencode.ai/v2/docs/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](https://nodejs.org/)

---

## 📋 Summary

| Category | Details |
|---|---|
| **Plugin** | OpenCode V2: `opencode-jev-pre-llm` |
| **Purpose** | Classify prompts via TypeSafe JEV *before* LLM reasoning, injecting determinism detection to avoid unnecessary LLM chain-of-thought |
| **JEV Provider** | OpenRouter: `typesafe/jev-1.13` (SystemOne API) |
| **Language** | TypeScript 5.6 |
| **Test Coverage** | 51/53 tests green, typecheck OK |
| **Fail-open** | JEV offline → LLM reasoning normal (never breaks session) |
| **License** | MIT |
| **Node** | >= 18 (fetch global) |

---

## 🚀 Quick Start

```sh
# Install
opencode plugin add github:murilogteixeira/opencode-jev-pre-llm

# Or clone locally
git clone https://github.com/murilogteixeira/opencode-jev-pre-llm
cd opencode-jev-pre-llm
npm install

# Configure
cp .env.example .env
# Set your OpenRouter API key:
# JEV_API_KEY=sk-or-v1-SEU_AQUI
# JEV_API_URL=https://openrouter.ai/api/v1/systemone
# JEV_MODEL=typesafe/jev-1.13

# Use in OpenCode
# The plugin will automatically:
# 1. Capture the user prompt
# 2. Classify via JEV (deterministic?)
# 2a. If deterministic → inject [JEV PRE-ANALYSIS] + temp=0 → LLM responds direct
# 2b. If not → LLM reasons normally (fail-open)
```

---

## 📖 How It Works

The plugin intercepts user prompts through OpenCode's hook system:

1. **Hook `prompt`** — Captures the user's prompt text once per turn
2. **Hook `context`** (first step of agent loop) — Classifies via JEV

**Decision flow:**
- **Deterministic** (noul ≥ threshold + confidence ≥ min): 
  - Injects `[JEV PRE-ANALYSIS]` into system prompt
  - Sets `temperature: 0`, `maxTokens: 400`
  - LLM responds directly — **no chain-of-thought**
- **Not deterministic** or JEV error:
  - `fail-open` → LLM reasons normally

**Key behaviors:**
- **1 classification per prompt**: First prompt of a turn triggers JEV; subsequent steps reuse cached verdict (TTL configurable, default 10 min)
- **Fail-open guaranteed**: Any JEV failure (network, timeout, invalid response) lets the session proceed normally
- **JEV doesn't generate responses**: It only classifies (`noul`/`choice`/`score`). The response still comes from the LLM; reasoning is only suppressed when JEV confirms it's unnecessary
- **Configurable thresholds**: `JEV_THRESHOLD` (0–1, default 0.8) and `JEV_MIN_CONFIDENCE` (0–2, default 1.0)

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

### Project Structure (SOLID)

| Module | Responsibility | SOLID |
|---|---|---|
| `src/config/dotenv.ts` | `.env` parser, zero deps | SRP |
| `src/config/config.ts` | Precedence: env > .env > defaults | SRP, OCP |
| `src/jev/types.ts` | `Classifier` interface + DTOs | ISP, DIP |
| `src/jev/client.ts` | `SystemOneClient` — fetch + AbortSignal timeout | LSP |
| `src/analysis/questions.ts` | Template of JEV questions | SRP, OCP |
| `src/analysis/decision.ts` | Pure policy: `inject` / `pass` / `failOpen` | SRP (100% testável) |
| `src/cache.ts` | TTL cache with injected clock | SRP |
| `src/hooks/*` | `prompt-capture` / `injection` adapters | SRP |
| `src/index.ts` | `Plugin.define` — just wiring/DI | DIP |

---

## 📜 License

MIT

---

## 🛠️ Installation

### Via OpenCode CLI (recommended)

```sh
opencode plugin add github:murilogteixeira/opencode-jev-pre-llm
```

### Local

```sh
git clone https://github.com/murilogteixeira/opencode-jev-pre-llm
cd opencode-jev-pre-llm
npm install
```

### Configuration

```bash
cp .env.example .env
# Fill with your OpenRouter API key:
JEV_API_KEY=sk-or-v1-SEU_AQUI
JEV_API_URL=https://openrouter.ai/api/v1/systemone
JEV_MODEL=typesafe/jev-1.13
```

### Usage in OpenCode

After installation, the plugin loads automatically. Whenever a user sends a prompt:

1. The JEV (via OpenRouter) classifies if the problem is deterministic
2. If yes → injects `[JEV PRE-ANALYSIS]` into system prompt + `temperature: 0` + `maxTokens: 400`
3. LLM responds directly — **no chain-of-thought**
4. If not or error → `fail-open` → LLM reasons normally

---

## 🤝 Contributing

1. Fork the repository
2. Create a branch (`git checkout -b feature/minha-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/minha-feature`)
5. Open a Pull Request

---

## 📬 Contact

- GitHub: [@murilogteixeira](https://github.com/murilogteixeira)
- Project: [opencode-jev-pre-llm](https://github.com/murilogteixeira/opencode-jev-pre-llm)