import { describe, it, expect } from "vitest"
import { decide, DecisionInput } from "../../src/analysis/decision"

const BASE: DecisionInput = {
  isDeterministic: true,
  noul: 0.9,
  confidence: 1.5,
  threshold: 0.8,
  minConfidence: 1.0,
}

describe("decide", () => {
  it("injects when noul >= threshold and confidence >= min", () => {
    const out = decide(BASE)
    expect(out.action).toBe("inject")
  })

  it("injects at exact boundary (noul == threshold, score == min)", () => {
    const out = decide({ ...BASE, noul: 0.8, confidence: 1.0 })
    expect(out.action).toBe("inject")
  })

  it("passes when noul below threshold", () => {
    const out = decide({ ...BASE, noul: 0.79 })
    expect(out.action).toBe("pass")
  })

  it("passes when confidence below min", () => {
    const out = decide({ ...BASE, confidence: 0.99 })
    expect(out.action).toBe("pass")
  })

  it("passes when JEV explicitly says not deterministic", () => {
    const out = decide({ ...BASE, isDeterministic: false })
    expect(out.action).toBe("pass")
    expect(out.reason).toContain("not deterministic")
  })

  it("failOpen when noul is NaN", () => {
    const out = decide({ ...BASE, noul: NaN })
    expect(out.action).toBe("failOpen")
  })

  it("failOpen when confidence is NaN", () => {
    const out = decide({ ...BASE, confidence: NaN })
    expect(out.action).toBe("failOpen")
  })

  it("failOpen when threshold is NaN", () => {
    const out = decide({ ...BASE, threshold: NaN })
    expect(out.action).toBe("failOpen")
  })

  it("failOpen when noul out of domain (> 1)", () => {
    const out = decide({ ...BASE, noul: 1.5 })
    expect(out.action).toBe("failOpen")
  })

  it("failOpen when noul out of domain (< 0)", () => {
    const out = decide({ ...BASE, noul: -0.1 })
    expect(out.action).toBe("failOpen")
  })

  it("failOpen when score out of domain (> 2)", () => {
    const out = decide({ ...BASE, confidence: 2.5 })
    expect(out.action).toBe("failOpen")
  })

  it("failOpen when score out of domain (< 0)", () => {
    const out = decide({ ...BASE, confidence: -0.5 })
    expect(out.action).toBe("failOpen")
  })

  it("does not throw for undefined values (treated as NaN)", () => {
    const out = decide({ ...BASE, noul: undefined as unknown as number })
    expect(out.action).toBe("failOpen")
  })
})