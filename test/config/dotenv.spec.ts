import { describe, it, expect } from "vitest"
import { parseDotEnv } from "../../src/config/dotenv"

describe("parseDotEnv", () => {
  it("parses KEY=value lines", () => {
    const raw = `FOO=bar\nBAZ=qux`
    const out = parseDotEnv(raw)
    expect(out).toEqual({ FOO: "bar", BAZ: "qux" })
  })

  it("trims whitespace around keys and values", () => {
    const raw = `  KEY  =  value  `
    const out = parseDotEnv(raw)
    expect(out).toEqual({ KEY: "value" })
  })

  it("supports double-quoted values", () => {
    const raw = `KEY="hello world"`
    const out = parseDotEnv(raw)
    expect(out).toEqual({ KEY: "hello world" })
  })

  it("supports single-quoted values", () => {
    const raw = `KEY='hello world'`
    const out = parseDotEnv(raw)
    expect(out).toEqual({ KEY: "hello world" })
  })

  it("ignores comments", () => {
    const raw = `# comment\nKEY=value\n# another comment`
    const out = parseDotEnv(raw)
    expect(out).toEqual({ KEY: "value" })
  })

  it("ignores empty lines", () => {
    const raw = `\n\nKEY=value\n\n`
    const out = parseDotEnv(raw)
    expect(out).toEqual({ KEY: "value" })
  })

  it("supports export prefix", () => {
    const raw = `export KEY=value`
    const out = parseDotEnv(raw)
    expect(out).toEqual({ KEY: "value" })
  })

  it("returns empty object for empty input", () => {
    const out = parseDotEnv("")
    expect(out).toEqual({})
  })

  it("returns empty object for whitespace-only input", () => {
    const out = parseDotEnv("   \n  \n")
    expect(out).toEqual({})
  })

  it("handles inline comments after value", () => {
    const raw = `KEY=value # comment`
    const out = parseDotEnv(raw)
    expect(out).toEqual({ KEY: "value" })
  })

  it("does not overwrite existing keys (first wins)", () => {
    const raw = `KEY=first\nKEY=second`
    const out = parseDotEnv(raw)
    expect(out).toEqual({ KEY: "first" })
  })
})