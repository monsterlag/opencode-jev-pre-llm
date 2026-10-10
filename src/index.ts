import { Plugin } from "@opencode/plugin"
import { loadConfig } from "./config/config"
import { SystemOneClient } from "./jev/client"
import type { Classifier } from "./jev/types"
import { buildQuestions } from "./analysis/questions"
import { decide } from "./analysis/decision"
import { TTLCache } from "./cache"
import { PendingPromptStore } from "./hooks/prompt-capture"
import { buildInjectionMessage, buildInjectionOptions } from "./hooks/injection"

/**
 * opencode-jev-pre-llm
 *
 * Intercepta prompts do usuário e os classifica via JEV (TypeSafe AI)
 * ANTES do LLM raciocinar. Se o problema for determinístico, injeta
 * instrução no system prompt + temperature: 0 + maxTokens reduzido,
 * para que a LLM responda diretamente sem cadeia de raciocínio.
 *
 * Fail-open: qualquer falha do JEV (rede, timeout, resposta inválida)
 * deixa a sessão seguir normalmente.
 */
export default Plugin.define({
  id: "opencode-jev-pre-llm",
  async setup(ctx) {
    const config = {
      ...loadConfig(),
      ...(ctx.options ?? {}),
    }

    const apiKey = config.JEV_API_KEY
    if (!apiKey) {
      console.warn(
        "[opencode-jev-pre-llm] JEV_API_KEY not set — plugin idle (fail-open). Set it in .env or environment.",
      )
      return
    }

    const classifier: Classifier = new SystemOneClient(
      config.JEV_API_URL,
      apiKey,
      config.JEV_MODEL,
      Number(config.JEV_TIMEOUT_MS) || 3000,
    )

    const threshold = Number(config.JEV_THRESHOLD) || 0.8
    const minConfidence = Number(config.JEV_MIN_CONFIDENCE) || 1.0
    const maxTokens = Number(config.JEV_MAX_TOKENS) || 400
    const ttlMs = Number(config.JEV_CACHE_TTL_MS) || 600_000

    const pending = new PendingPromptStore()
    const verdicts = new TTLCache<{ action: string; reason: string }>(ttlMs)
    const questions = buildQuestions()

    // 1. Captura o prompt no momento da admissão (1× por turno)
    const promptReg = await ctx.session.hook("prompt", (event: { prompt: { text: string }; sessionID?: string }) => {
      try {
        const sessionID = event.sessionID
        if (!sessionID) return
        pending.add(sessionID, event.prompt.text)
      } catch (err) {
        console.warn("[opencode-jev-pre-llm] prompt hook error (ignored):", err)
      }
    })

    // 2. Antes de cada model call do agent loop: analisa/injeta
    const reg = await ctx.session.hook("context", async (event) => {
      const sessionID = event.sessionID
      const p = pending.take(sessionID)
      if (!p) return

      const hash = p.text
      let verdict = verdicts.get(hash)

      if (!verdict) {
        try {
          const result = await classifier.classify(p.text, questions)
          verdict = decide({
            isDeterministic: result.isDeterministic,
            noul: (result as { noul?: number }).noul ?? (result.isDeterministic ? 1 : 0),
            confidence: result.confidence,
            threshold,
            minConfidence,
          })
          verdicts.set(hash, verdict)
        } catch (err) {
          console.warn("[opencode-jev-pre-llm] JEV call failed (fail-open):", err)
          return
        }
      }

      if (verdict.action === "inject") {
        event.system.push({ type: "text", text: buildInjectionMessage(verdict.reason) })
        Object.assign(event.options, buildInjectionOptions(maxTokens))
      }
    })

    console.log(
      `[opencode-jev-pre-llm] active (model=${config.JEV_MODEL}, threshold=${threshold}, minConfidence=${minConfidence})`,
    )

    return () => {
      void reg.dispose()
      pending.clear()
      verdicts.clear()
    }
  },
})