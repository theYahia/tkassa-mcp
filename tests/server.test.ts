import { describe, it, expect, vi } from "vitest";

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: vi.fn(),
}));

vi.mock("../src/client.js", () => ({
  TKassaClient: class {
    post = vi.fn();
  },
  toKopecks: (r: number) => Math.round(r * 100),
}));

vi.spyOn(process, "exit").mockImplementation((() => {}) as any);

describe("server smoke test", () => {
  it("registers exactly 5 tools", async () => {
    const { server } = await import("../src/index.js");
    const s = server as any;
    expect(s._registeredTools).toBeDefined();
    const toolNames = Object.keys(s._registeredTools);
    expect(toolNames.length).toBe(5);
    const expected = ["init_payment", "get_state", "confirm_payment", "cancel_payment", "refund_payment"];
    for (const n of expected) {
      expect(toolNames).toContain(n);
    }
  });
});
