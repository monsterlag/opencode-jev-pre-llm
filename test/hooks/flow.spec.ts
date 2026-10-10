import { describe, it, expect, vi } from "vitest"
import { PendingPromptStore } from "../../src/hooks/prompt-capture"
import { TTLCache } from "../../src/cache"
import { decide } from "../../src/analysis/decision"
import { buildInjectionMessage, buildInjectionOptions } from "../../src/hooks/injection"
import type { Question, SystemOneResponse } from "../../src/jev/types"

/**
 * Teste de integração do fluxo completo do plugin sem OpenCode real:
 * prompt-capture → context-inject → decision → injection → cache.
 */

interface FakeSystemPart {
  type: "text"
  text: string
}

interface FakeContextEvent {
  sessionID: string
  system: FakeSystemPart[]
  options: Record<string, unknown>
}

interface FakePromptEvent {
  sessionID: string
  prompt: { text: string }
}

interface FakeClassifier {
  calls: number
  response: SystemOneResponse | Error
  classify(state: string, questions: Record<string, Question>): Promise<SystemOneResponse>
}

function makeClassifier(response: SystemOneResponse | Error): FakeClassifier {
  return {
    calls: 0,
    response,
    async classify() {
      this.calls++
      if (this.response instanceof Error) throw this.response
      return this.response
    },
  }
}

const JEV_DETERMINISTIC: SystemOneResponse = {
  model: "jev-test",
  answers: {
    is_deterministic: { type: "noul", noul: 0.95 },
    confidence: { type: "score", score: 2 },
    suggested_answer: { type: "choice", choice: "answer_provided" },
  },
}

const JEV_NOT_DETERMINISTIC: SystemOneResponse = {
  model: "jev-test",
  answers: {
    is_deterministic: { type: "noul", noul: 0.1 },
    confidence: { type: "score", score: 0 },
  },
}

/** Réplica do fluxo que src/index.ts irá montar (para validar o wiring antes do plugin real). */
function buildFlow(classifier: FakeClassifier, opts: { threshold: number; minConfidence: number; maxTokens: number; ttlMs: number; clock: () => number }) {
  const pending = new PendingPromptStore()
  const verdicts = new TTLCache<{ action: string; reason: string }>(opts.ttlMs, opts.clock)

  const onPrompt = (event: FakePromptEvent) => {
    pending.add(event.sessionID, event.prompt.text)
  }

  const onContext = async (event: FakeContextEvent) => {
    const p = pending.take(event.sessionID)
    if (!p) return

    const hash = p.text
    let verdict = verdicts.get(hash)
    if (!verdict) {
      try {
        const resp = await classifier.classify(p.text, {})
        const det = resp.answers?.is_deterministic
        const conf = resp.answers?.confidence
        verdict = decide({
          isDeterministic: (det?.noul ?? 0) > 0,
          noul: det?.noul ?? NaN,
          confidence: conf?.score ?? NaN,
          threshold: opts.threshold,
          minConfidence: opts.minConfidence,
        })
        verdicts.set(hash, verdict)
      } catch {
        verdict = { action: "failOpen", reason: "JEV error" }
      }
    }

    if (verdict.action === "inject") {
      event.system.push({ type: "text", text: buildInjectionMessage(verdict.reason) })
      Object.assign(event.options, buildInjectionOptions(opts.maxTokens))
    }
  }

  return { onPrompt, onContext, pending, verdicts }
}

describe("plugin flow (prompt → context)", () => {
  const baseOpts = { threshold: 0.8, minConfidence: 1.0, maxTokens: 400, ttlMs: 10_000, clock: () => Date.now() }

  it("injects instruction + temperature 0 when JEV says deterministic", async () => {
    const classifier = makeClassifier(JEV_DETERMINISTIC)
    const flow = buildFlow(classifier, baseOpts)

    flow.onPrompt({ sessionID: "s1", prompt: { text: "What is 2+2?" } })
    const event: FakeContextEvent = {
      sessionID: "s1",
      system: [{ type: "text", text: "You are a helpful assistant." }],
      options: {},
    }
    await flow.onContext(event)

    expect(classifier.calls).toBe(1)
    expect(event.system).toHaveLength(2)
    expect(event.system[1].text).toContain("[JEV PRE-ANALYSIS]")
    expect(event.options.temperature).toBe(0)
    expect(event.options.maxTokens).toBe(400)
  })

  it("does not inject when JEV says not deterministic", async () => {
    const classifier = makeClassifier(JEV_NOT_DETERMINISTIC)
    const flow = buildFlow(classifier, baseOpts)

    flow.onPrompt({ sessionID: "s2", prompt: { text: "Design a distributed cache" } })
    const event: FakeContextEvent = {
      sessionID: "s2",
      system: [{ type: "text", text: "base" }],
      options: {},
    }
    await flow.onContext(event)

    expect(classifier.calls).toBe(1)
    expect(event.system).toHaveLength(1)
    expect(event.options.temperature).toBeUndefined()
  })

  it("fails open when JEV throws", async () => {
    const classifier = makeClassifier(new Error("offline"))
    const flow = buildFlow(classifier, baseOpts)

    flow.onPrompt({ sessionID: "s3", prompt: { text: "hello" } })
    const event: FakeContextEvent = {
      sessionID: "s3",
      system: [{ type: "text", text: "base" }],
      options: {},
    }
    await flow.onContext(event)

    expect(event.system).toHaveLength(1)
    expect(event.options.temperature).toBeUndefined()
  })

  it("classifies once per prompt: second context step uses cache", async () => {
    const classifier = makeClassifier(JEV_DETERMINISTIC)
    const flow = buildFlow(classifier, baseOpts)

    flow.onPrompt({ sessionID: "s4", prompt: { text: "same prompt" } })

    const makeEvent = (): FakeContextEvent => ({
      sessionID: "s4",
      system: [{ type: "text", text: "base" }],
      options: {},
    })

    const step1 = makeEvent()
    await flow.onContext(step1)
    expect(classifier.calls).toBe(1)
    expect(step1.system).toHaveLength(2)

    // Passo 2 do agent loop (ex.: após tool call) — sem novo prompt
    const step2 = makeEvent()
    await flow.onContext(step2)
    expect(classifier.calls).toBe(1) // cache hit — não reclassifica
    expect(step2.system).toHaveLength(1) // mas não re-injeta (prompt já consumido)
  })

  it("re-classifies when a NEW prompt arrives (different turn)", async () => {
    const classifier = makeClassifier(JEV_DETERMINISTIC)
    const flow = buildFlow(classifier, baseOpts)

    flow.onPrompt({ sessionID: "s5", prompt: { text: "first question" } })
    await flow.onContext({
      sessionID: "s5",
      system: [{ type: "text", text: "base" }],
      options: {},
    })
    expect(classifier.calls).toBe(1)

    // Novo turno
    flow.onPrompt({ sessionID: "s5", prompt: { text: "second question" } })
    await flow.onContext({
      sessionID: "s5",
      system: [{ type: "text", text: "base" }],
      options: {},
    })
    expect(classifier.calls).toBe(2)
  })

  it("no pending prompt → no JEV call, no injection", async () => {
    const classifier = makeClassifier(JEV_DETERMINISTIC)
    const flow = buildFlow(classifier, baseOpts)

    const event: FakeContextEvent = {
      sessionID: "unknown-session",
      system: [{ type: "text", text: "base" }],
      options: {},
    }
    await flow.onContext(event)

    expect(classifier.calls).toBe(0)
    expect(event.system).toHaveLength(1)
  })
})