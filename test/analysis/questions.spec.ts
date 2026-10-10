import { describe, it, expect } from "vitest"
import { buildQuestions } from "../../src/analysis/questions"

describe("buildQuestions", () => {
  it("returns determinism, confidence and suggested_answer", () => {
    const q = buildQuestions()
    expect(q.is_deterministic.type).toBe("noul")
    expect(q.confidence.type).toBe("score")
    expect(q.suggested_answer.type).toBe("choice")
  })

  it("has deterministic question with non-empty instructions", () => {
    const q = buildQuestions()
    expect(typeof q.is_deterministic.instructions).toBe("string")
    expect(q.is_deterministic.instructions.length).toBeGreaterThan(20)
  })

  it("confidence is score with 3-criteria range", () => {
    const q = buildQuestions()
    expect(q.confidence.criteria).toHaveLength(3)
  })

  it("suggested_answer choice criteria includes needs_reasoning", () => {
    const q = buildQuestions()
    const criteria = q.suggested_answer.criteria as Record<string, string>
    expect(criteria.needs_reasoning).toBeTruthy()
    expect(criteria.answer_provided).toBeTruthy()
  })
})