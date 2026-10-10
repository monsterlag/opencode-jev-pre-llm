import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { loadConfig } from "../../src/config/config"
import fs from "node:fs"
import path from "node:path"

describe("loadConfig", () => {
  const backupEnv = process.env
  const cwd = process.cwd()
  const testDir = path.join(cwd, "test", "config", ".tmp")

  beforeEach(() => {
    process.env = { ...backupEnv }
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }
  })

  afterEach(() => {
    process.env = backupEnv
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true })
    }
  })

  it("returns defaults when no input provided", async () => {
    const out = loadConfig()
    expect(out.JEV_API_KEY).toBe("")
    expect(out.JEV_API_URL).toBe("https://api.typesafe.ai/v1/systemone")
    expect(out.JEV_MODEL).toBe("jev-latest")
    expect(Number(out.JEV_THRESHOLD)).toBe(0.8)
    expect(Number(out.JEV_MIN_CONFIDENCE)).toBe(1.0)
    expect(Number(out.JEV_TIMEOUT_MS)).toBe(3000)
    expect(Number(out.JEV_MAX_TOKENS)).toBe(400)
  })

  it("process.env overrides defaults", () => {
    process.env.JEV_API_KEY = "env-key"
    process.env.JEV_THRESHOLD = "0.9"
    const out = loadConfig()
    expect(out.JEV_API_KEY).toBe("env-key")
    expect(Number(out.JEV_THRESHOLD)).toBe(0.9)
  })

  it(".env file overrides process.env and defaults", () => {
    process.env.JEV_API_KEY = "env-key"
    process.env.JEV_THRESHOLD = "0.7"
    process.env.JEV_MODEL = "env-model"
    process.env.JEV_API_URL = "https://env.example.com"

    fs.writeFileSync(path.join(testDir, ".env"), `
      JEV_API_KEY=dotenv-key
      JEV_THRESHOLD=0.9
    `)

    // Teste executa no cwd do projeto; usamos vi.setTestEnv / vi.unstubAllEnvs no cwd
    process.chdir(testDir)
    const out = loadConfig()
    expect(out.JEV_API_KEY).toBe("dotenv-key")
    expect(Number(out.JEV_THRESHOLD)).toBe(0.9)
    expect(out.JEV_MODEL).toBe("env-model")
    expect(out.JEV_API_URL).toBe("https://env.example.com")
  })
})