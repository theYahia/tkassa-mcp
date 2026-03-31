#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  initPaymentSchema, handleInitPayment,
  getStateSchema, handleGetState,
  confirmSchema, handleConfirm,
  cancelSchema, handleCancel,
} from "./tools/payments.js";
import {
  cancelPaymentSchema, handleCancelPayment,
} from "./tools/refunds.js";

const server = new McpServer({
  name: "tkassa-mcp",
  version: "1.1.0",
});

// Payments
server.tool(
  "init_payment",
  "Инициализировать платёж в T-Kassa. Возвращает PaymentURL для оплаты.",
  initPaymentSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleInitPayment(params) }],
  }),
);

server.tool(
  "get_state",
  "Получить статус платежа по PaymentId.",
  getStateSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetState(params) }],
  }),
);

server.tool(
  "confirm_payment",
  "Подтвердить платёж (для двухстадийных). Можно подтвердить частичную сумму.",
  confirmSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleConfirm(params) }],
  }),
);

server.tool(
  "cancel_payment",
  "Отменить платёж до или после подтверждения.",
  cancelSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleCancel(params) }],
  }),
);

// Refunds
server.tool(
  "refund_payment",
  "Возврат средств по платежу (полный или частичный). Использует /Cancel.",
  cancelPaymentSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleCancelPayment(params) }],
  }),
);

async function main() {
  const httpPort = process.env.HTTP_PORT || (process.argv.includes("--http") ? process.argv[process.argv.indexOf("--http") + 1] : null);
  if (httpPort) {
    const port = parseInt(String(httpPort), 10) || 3000;
    await startHttpTransport(port);
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[tkassa-mcp] Сервер запущен (stdio). 5 инструментов.");
  }
}

async function startHttpTransport(port: number) {
  const { createServer } = await import("node:http");
  const { StreamableHTTPServerTransport } = await import("@modelcontextprotocol/sdk/server/streamableHttp.js");
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined as unknown as (() => string) });
  const httpServer = createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", tools: 5, transport: "streamable-http" }));
      return;
    }
    if (req.url === "/mcp") { await transport.handleRequest(req, res); return; }
    res.writeHead(404); res.end("Not found. Use /mcp or /health.");
  });
  await server.connect(transport);
  httpServer.listen(port, () => {
    console.error(`[tkassa-mcp] HTTP server on port ${port}. 5 tools available.`);
  });
}

const isDirectRun = process.argv[1]?.endsWith("index.js") || process.argv[1]?.endsWith("index.ts");
if (isDirectRun) {
  main().catch((error) => { console.error("[tkassa-mcp] Ошибка запуска:", error); process.exit(1); });
}

export { server };
