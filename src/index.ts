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
  version: "1.0.0",
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[tkassa-mcp] Сервер запущен. 5 инструментов. Первый MCP для T-Kassa.");
}

main().catch((error) => {
  console.error("[tkassa-mcp] Ошибка запуска:", error);
  process.exit(1);
});
