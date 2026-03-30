import crypto from "node:crypto";
import type { TKassaResponse } from "./types.js";

const BASE_URL = "https://securepay.tinkoff.ru/v2";
const TIMEOUT = 10_000;
const MAX_RETRIES = 3;

export class TKassaClient {
  private terminalKey: string;
  private password: string;

  constructor() {
    this.terminalKey = process.env.TKASSA_TERMINAL_KEY ?? "";
    this.password = process.env.TKASSA_PASSWORD ?? "";

    if (!this.terminalKey || !this.password) {
      throw new Error(
        "Переменные окружения TKASSA_TERMINAL_KEY и TKASSA_PASSWORD обязательны. " +
        "Получите их в личном кабинете T-Kassa: Магазины → Терминалы"
      );
    }
  }

  /**
   * Generate Token for request signing.
   * T-Kassa token: SHA-256 of concatenated values sorted alphabetically by key.
   * Password is added as key "Password" before sorting.
   */
  private generateToken(params: Record<string, unknown>): string {
    const signableParams: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      // Skip nested objects/arrays — only scalar values participate in signing
      if (typeof value === "object" && value !== null) continue;
      if (value === undefined || value === null) continue;
      signableParams[key] = String(value);
    }

    // Add Password for signing (not sent in the request itself)
    signableParams["Password"] = this.password;

    // Sort by key, concatenate values
    const concatenated = Object.keys(signableParams)
      .sort()
      .map(key => signableParams[key])
      .join("");

    return crypto.createHash("sha256").update(concatenated).digest("hex");
  }

  async post(path: string, body: Record<string, unknown> = {}): Promise<TKassaResponse> {
    const url = `${BASE_URL}${path}`;

    // Always include TerminalKey
    body.TerminalKey = this.terminalKey;

    // Generate and attach token
    body.Token = this.generateToken(body);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (response.ok) {
          const result = (await response.json()) as TKassaResponse;

          // T-Kassa returns 200 even on logical errors — check Success field
          if (!result.Success && result.ErrorCode !== "0") {
            const msg = result.Message ?? "Unknown error";
            const details = result.Details ? ` (${result.Details})` : "";
            throw new Error(`T-Kassa [${result.ErrorCode}]: ${msg}${details}`);
          }

          return result;
        }

        const errorBody = await response.text();

        // Retry on 429 and 5xx
        if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
          const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
          console.error(`[tkassa-mcp] ${response.status} от ${path}, повтор через ${delay}мс (${attempt}/${MAX_RETRIES})`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        throw new Error(`T-Kassa HTTP ${response.status}: ${errorBody}`);
      } catch (error) {
        clearTimeout(timer);
        if (error instanceof DOMException && error.name === "AbortError") {
          if (attempt < MAX_RETRIES) {
            console.error(`[tkassa-mcp] Таймаут ${path}, повтор (${attempt}/${MAX_RETRIES})`);
            continue;
          }
          throw new Error("T-Kassa: таймаут запроса (10 секунд). Попробуйте позже.");
        }
        throw error;
      }
    }

    throw new Error("T-Kassa: все попытки исчерпаны");
  }
}

/** Convert rubles to kopecks for T-Kassa API (e.g. 100.50 → 10050) */
export function toKopecks(rubles: number): number {
  return Math.round(rubles * 100);
}
