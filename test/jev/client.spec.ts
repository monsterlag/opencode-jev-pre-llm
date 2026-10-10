import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { SystemOneClient, JevError } from "../../src/jev/client"
import type { ClassifierResult, Question } from "../../src/jev/types"

const MOCK_RESPONSE: ClassifierResult = {
  isDeterministic: true,
  confidence: 1.5,
  suggestedAnswer: "answer_provided",
  model: "jev-1.13.0",
  usage: { input_tokens: 100, output_tokens: 50 },
}

const MOCK_QUESTIONS: Record<string, Question> = {
  is_deterministic: {
    type: "noul",
    instructions: "Test",
  },
  confidence: {
    type: "score",
    instructions: "Test",
    criteria: ["Low", "Medium", "High"],
  },
  suggested_answer: {
    type: "choice",
    instructions: "Test",
    criteria: {
      answer_provided: "Yes",
      needs_reasoning: "No",
    },
  },
}

describe("SystemOneClient", () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it("successfully classifies and maps response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          model: "jev-1.13.0",
          answers: {
            is_deterministic: { type: "noul", noul: 0.9 },
            confidence: { type: "score", score: 1.5 },
            suggested_answer: { type: "choice", choice: "answer_provided" },
          },
          usage: { input_tokens: 100, output_tokens: 50 },
        }),
    })

    const client = new SystemOneClient(
      "https://api.typesafe.ai/v1/systemone",
      "test-key",
      "jev-latest",
      3000,
    )

    const result = await client.classify("test state", MOCK_QUESTIONS)

    expect(result.isDeterministic).toBe(true)
    expect(result.confidence).toBe(1.5)
    expect(result.suggestedAnswer).toBe("answer_provided")
    expect(result.model).toBe("jev-1.13.0")
    expect(result.usage).toEqual({ input_tokens: 100, output_tokens: 50 })
  })

  it("throws JevError on HTTP error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      text: () => Promise.resolve("rate limited"),
    })

    const client = new SystemOneClient(
      "https://api.typesafe.ai/v1/systemone",
      "test-key",
      "jev-latest",
      3000,
    )

    await expect(client.classify("test", MOCK_QUESTIONS)).rejects.toThrow(
      JevError,
    )
    await expect(client.classify("test", MOCK_QUESTIONS)).rejects.toMatchObject(
      { status: 429 },
    )
  })

  it("throws JevError on timeout", async () => {
    global.fetch = vi.fn().mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(new DOMException("Aborted", "AbortError")), 100)),
    )

    const client = new SystemOneClient(
      "https://api.typesafe.ai/v1/systemone",
      "test-key",
      "jev-latest",
      50,
    )

    await expect(client.classify("test", MOCK_QUESTIONS)).rejects.toThrow(
      JevError,
    )
    await expect(client.classify("test", MOCK_QUESTIONS)).rejects.toThrow(
      "timed out",
    )
  })

  it("throws JevError on network failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"))

    const client = new SystemOneClient(
      "https://api.typesafe.ai/v1/systemone",
      "test-key",
      "jev-latest",
      3000,
    )

    await expect(client.classify("test", MOCK_QUESTIONS)).rejects.toThrow(
      JevError,
    )
    await expect(client.classify("test", MOCK_QUESTIONS)).rejects.toThrow(
      "network error",
    )
  })

  it("maps missing/invalid answers to safe defaults", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ model: "jev-1.13.0", answers: {} }),
    })

    const client = new SystemOneClient(
      "https://api.typesafe.ai/v1/systemone",
      "test-key",
      "jev-latest",
      3000,
    )

    const result = await client.classify("test", MOCK_QUESTIONS)

    expect(result.isDeterministic).toBe(false)
    expect(result.confidence).toBe(0)
    expect(result.suggestedAnswer).toBeUndefined()
  })
})