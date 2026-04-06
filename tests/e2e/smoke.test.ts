import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { runSmokeTest } from "@theyahia/mcp-core/testing/smoke.js";

const SERVER_PATH = resolve(import.meta.dirname, "../../dist/index.js");

describe("T-Kassa MCP E2E Smoke Test", () => {
  it("starts and lists 5 tools", async () => {
    const result = await runSmokeTest({
      serverPath: SERVER_PATH,
      expectedToolCount: 5,
      env: { TKASSA_TERMINAL_KEY: "test", TKASSA_PASSWORD: "test" },
    });

    expect(result.connected).toBe(true);
    expect(result.toolCount).toBe(5);
    expect(result.errors).toHaveLength(0);
  }, 15_000);

  it("all tools have quality descriptions (20+ chars)", async () => {
    const result = await runSmokeTest({
      serverPath: SERVER_PATH,
      expectedToolCount: 5,
      env: { TKASSA_TERMINAL_KEY: "test", TKASSA_PASSWORD: "test" },
    });

    for (const tool of result.tools) {
      expect(tool.descriptionLength).toBeGreaterThanOrEqual(20);
      expect(tool.hasInputSchema).toBe(true);
    }
  }, 15_000);

  it("has expected tool names", async () => {
    const result = await runSmokeTest({
      serverPath: SERVER_PATH,
      expectedToolCount: 5,
      env: { TKASSA_TERMINAL_KEY: "test", TKASSA_PASSWORD: "test" },
    });

    const names = result.tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "cancel_payment",
      "confirm_payment",
      "get_state",
      "init_payment",
      "refund_payment",
    ]);
  }, 15_000);
});
