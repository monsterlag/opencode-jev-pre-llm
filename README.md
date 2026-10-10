# opencode-jev-pre-llm

Plugin [OpenCode V2](https://opencode.ai/v2/docs/) que classifica prompts com o
**JEV (TypeSafe AI)** *antes* do LLM raciocinar. Se a solicitação for
determinística (resposta direta possível), o plugin injeta instrução no system
prompt com `temperature: 0` e `maxTokens` reduzido — a LLM responde direto,
sem cadeia de raciocínio.

## Como funciona

```
usuário envia prompt
      │
      ▼
[prompt hook] captura o texto (1× por turno)
      │
      ▼
[context hook] 1º passo do agent loop
      ├─ cache hit?  → usa veredito
      └─ cache miss? → chama JEV (systemone)
              ├─ determinístico + confiança alta
              │     → injeta "[JEV PRE-ANALYSIS]" no system
              │     → temperature = 0, maxTokens reduzido
              └─ caso contrário (ou erro/timeout)
                    → fail-open: LLM raciocina normalmente
```

- **Fail-open garantido**: JEV offline, timeout ou resposta inválida nunca
  quebra a sessão — o LLM segue o fluxo padrão.
- **1 classificação por prompt**: os passos seguintes do agent loop (após tool
  calls) reutilizam o veredito em cache por hash do prompt (TTL configurável).
- **JEV não escreve a resposta**: ele classifica. A resposta continua vindo da
  LLM — só o raciocínio é suprimido quando desnecessário.

## Instalação

### Do GitHub (recomendado para teste)

```sh
opencode plugin add github:<seu-usuario>/opencode-jev-pre-llm
```

### Local (desenvolvimento)

```sh
git clone https://github.com/<seu-usuario>/opencode-jev-pre-llm
cd opencode-jev-pre-llm
npm install
```

E registre no `opencode.json(c)` do seu projeto:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["/caminho/absoluto/para/opencode-jev-pre-llm"]
}
```

## Configuração

Copie `.env.example` para `.env` (na raiz do projeto onde o OpenCode roda) e
preencha:

```bash
JEV_API_KEY=sk-...                 # obrigatório (alias: TYPESAFE_API_KEY)
JEV_API_URL=https://api.typesafe.ai/v1/systemone
JEV_MODEL=jev-latest               # provedor/modelo JEV injetáveis
JEV_THRESHOLD=0.8                  # noul mínimo p/ injetar
JEV_MIN_CONFIDENCE=1.0             # score mínimo (0–2)
JEV_TIMEOUT_MS=3000
JEV_MAX_TOKENS=400
```

Precedência: `options` do `opencode.jsonc` > variáveis de ambiente > `.env` do
projeto > `.env` da home > defaults.

Também é possível configurar via `opencode.jsonc`:

```jsonc
{
  "plugins": [
    {
      "package": "opencode-jev-pre-llm",
      "options": { "JEV_THRESHOLD": "0.9", "JEV_MODEL": "jev-latest" }
    }
  ]
}
```

## Desenvolvimento

```sh
npm install
npm test          # 53 testes, sem rede
npm run typecheck # tsc --noEmit
```

### Estrutura (SOLID)

| Módulo                  | Responsabilidade                                        |
|-------------------------|---------------------------------------------------------|
| `src/config/dotenv.ts`  | Parser `.env` puro (zero deps)                          |
| `src/config/config.ts`  | Precedência options > env > .env > defaults             |
| `src/jev/types.ts`      | Porta `Classifier` + DTOs (DIP)                         |
| `src/jev/client.ts`     | `SystemOneClient` — fetch + timeout (AbortSignal)       |
| `src/analysis/questions`| Template das perguntas JEV                              |
| `src/analysis/decision` | Política pura: `inject` / `pass` / `failOpen`           |
| `src/cache.ts`          | Cache TTL com clock injetado                            |
| `src/hooks/*`           | Adaptadores `prompt-capture` / `injection`              |
| `src/index.ts`          | `Plugin.define` — apenas wiring/DI                      |

## Limitações conhecidas

- Requer Node >= 18 (fetch global) na máquina que roda o servidor OpenCode.
- O hook `prompt` do OpenCode V2 não roda para mensagens sintéticas, shell,
  compactação ou controles de movimento — esses fluxos não são analisados.
- JEV classifica; não gera respostas livres. Respostas 100% determinísticas
  (sem LLM) exigiriam critérios `choice` pré-configurados.

## Licença

MIT
