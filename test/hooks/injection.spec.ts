import { describe, it, expect } from "vitest"
import { buildInjectionMessage, buildInjectionOptions } from "../../src/hooks/injection"

describe("injection", () => {
  it("builds system injection message with reason", () => {
    const msg = buildInjectionMessage("deterministic confirmed")
    expect(msg).toContain("[JEV PRE-ANALYSIS]")
    expect(msg).toContain("deterministic confirmed")
    expect(msg).toContain("Respond DIRECTLY")
  })

  it("injection options set temperature to zero", () => {
    const opts = buildInjectionOptions(400)
    expect(opts.temperature).toBe(0)
    expect(opts.maxTokens).toBe(400)
  })

  it("message mentions avoiding extended reasoning", () => {
    const msg = buildInjectionMessage("any")
    expect(msg.toLowerCase()).toContain("reasoning")
  })
})