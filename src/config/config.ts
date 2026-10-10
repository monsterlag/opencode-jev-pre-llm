import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { parseDotEnv, DotEnvValues } from "./dotenv"

/**
 * Carrega a configuração completa do plugin.
 * Precedência (mais alta → mais baixa):
 *   1. Variáveis de ambiente do sistema (process.env, prefix OPENCODE_)
 *   2. Arquivo .env na raiz do plugin
 *   3. Arquivo .env na home do usuário
 *   4. Defaults (fallback)
 *
 * Cada fonte é verificada em ordem; a primeira que fornece um valor vence.
 */
export function loadConfig(): Record<string, string> {
  // 1. Variáveis de ambiente do sistema (OPENCODE_* e JEV_*)
  const envValues: DotEnvValues = {}
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("OPENCODE_") || key.startsWith("JEV_")) {
      envValues[key] = process.env[key]!
    }
  }

  // 2. .env na raiz do plugin
  const projectEnvPath = path.resolve(process.cwd(), ".env")
  let projectDotEnv: DotEnvValues = {}
  if (fs.existsSync(projectEnvPath)) {
    projectDotEnv = parseDotEnv(fs.readFileSync(projectEnvPath, "utf-8"))
  }

  // 3. .env na home do usuário
  let homeDotEnv: DotEnvValues = {}
  const homeEnvPath = path.join(os.homedir(), ".env")
  if (fs.existsSync(homeEnvPath)) {
    homeDotEnv = parseDotEnv(fs.readFileSync(homeEnvPath, "utf-8"))
  }

  // 4. Defaults (fallback)
  const defaults: Record<string, string> = {
    JEV_API_KEY: "",
    JEV_API_URL: "https://api.typesafe.ai/v1/systemone",
    JEV_MODEL: "jev-latest",
    JEV_THRESHOLD: "0.8",
    JEV_MIN_CONFIDENCE: "1.0",
    JEV_TIMEOUT_MS: "3000",
    JEV_MAX_TOKENS: "400",
  }

  // Merge na ordem correta de precedência
  return { ...defaults, ...envValues, ...projectDotEnv, ...homeDotEnv }
}

export default loadConfig
