#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  initPaymentSchema, handleInitPayment,
  getStateSchema, handleGetState,
  confirmSchema, handleConfirm,
  cancelSchema, handleCancel,
  chargeSchema, handleCharge,
} from "./tools/payments.js";
import {
  refundPaymentSchema, handleRefundPayment,
} from "./tools/refunds.js";
import {
  addCustomerSchema, handleAddCustomer,
  getCustomerSchema, handleGetCustomer,
  removeCustomerSchema, handleRemoveCustomer,
  getCardListSchema, handleGetCardList,
  removeCardSchema, handleRemoveCard,
} from "./tools/customers.js";
import {
  createSbpQrSchema, handleCreateSbpQr,
  getSbpQrStateSchema, handleGetSbpQrState,
} from "./tools/sbp.js";
import {
  sendClosingReceiptSchema, handleSendClosingReceipt,
} from "./tools/receipts.js";

const TOOL_COUNT = 14;

const server = new McpServer({
  name: "tkassa-mcp",
  version: "2.0.0",
});

// ── Payments (5) ──────────────────────────────────────────────

server.tool(
  "init_payment",
  "Create a new payment in T-Kassa. Returns PaymentURL for the customer to pay. Supports one-step (PayType=O) and two-step (PayType=T) payments, receipts (54-FZ), recurring (Recurrent=Y), and custom DATA fields.",
  initPaymentSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleInitPayment(params) }],
  }),
);

server.tool(
  "get_payment_state",
  "Get current status of a payment by PaymentId. Returns Status (NEW, AUTHORIZED, CONFIRMED, REVERSED, REFUNDED, REJECTED, etc.), Amount, OrderId.",
  getStateSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetState(params) }],
  }),
);

server.tool(
  "confirm_payment",
  "Confirm a two-step (PayType=T) payment. Optionally confirm a partial amount (less than original). The payment must be in AUTHORIZED status.",
  confirmSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleConfirm(params) }],
  }),
);

server.tool(
  "cancel_payment",
  "Cancel a payment before or after confirmation. For partial cancellation, specify amount. Works on payments in NEW, AUTHORIZED, or CONFIRMED status.",
  cancelSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleCancel(params) }],
  }),
);

server.tool(
  "charge_payment",
  "Charge a recurring payment using a saved card (RebillId). First create a payment with init_payment (Recurrent=Y, CustomerKey), then call charge with the RebillId from the notification or get_card_list.",
  chargeSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleCharge(params) }],
  }),
);

// ── Refunds (1) ───────────────────────────────────────────────

server.tool(
  "refund_payment",
  "Refund a payment (full or partial). For partial refund, specify amount in rubles. Uses the /Cancel endpoint internally. The payment must be in CONFIRMED status.",
  refundPaymentSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleRefundPayment(params) }],
  }),
);

// ── Customers & Cards (5) ─────────────────────────────────────

server.tool(
  "add_customer",
  "Register a customer in T-Kassa for saving cards and recurring payments. Provide CustomerKey (your internal ID), optionally Email and Phone.",
  addCustomerSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleAddCustomer(params) }],
  }),
);

server.tool(
  "get_customer",
  "Get customer data by CustomerKey. Returns stored Email and Phone.",
  getCustomerSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetCustomer(params) }],
  }),
);

server.tool(
  "remove_customer",
  "Remove a customer and all their saved cards from T-Kassa.",
  removeCustomerSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleRemoveCustomer(params) }],
  }),
);

server.tool(
  "get_card_list",
  "Get list of saved cards for a customer. Returns CardId, Pan (masked), ExpDate, CardType, and RebillId (needed for recurring charges).",
  getCardListSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetCardList(params) }],
  }),
);

server.tool(
  "remove_card",
  "Remove a saved card from a customer. Requires CustomerKey and CardId (from get_card_list).",
  removeCardSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleRemoveCard(params) }],
  }),
);

// ── SBP - Fast Payments System (2) ───────────────────────────

server.tool(
  "create_sbp_qr",
  "Generate a QR code for SBP (Sistema Bystrykh Platezhey / Fast Payments System) payment. First call init_payment, then pass the PaymentId here. Returns QR payload or base64 PNG image.",
  createSbpQrSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleCreateSbpQr(params) }],
  }),
);

server.tool(
  "get_sbp_qr_state",
  "Check the status of an SBP QR code payment. Returns whether the customer has scanned and paid via SBP.",
  getSbpQrStateSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetSbpQrState(params) }],
  }),
);

// ── Receipts - 54-FZ (1) ─────────────────────────────────────

server.tool(
  "send_closing_receipt",
  "Send a closing receipt (zakryvayushchiy chek) for 54-FZ fiscal compliance. Provide Items with Name, Price, Quantity, Amount, Tax. Requires Email or Phone for delivery.",
  sendClosingReceiptSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleSendClosingReceipt(params) }],
  }),
);

// ── Start ─────────────────────────────────────────────────────

async function main() {
  const httpPort = process.env.HTTP_PORT || (process.argv.includes("--http") ? process.argv[process.argv.indexOf("--http") + 1] : null);
  if (httpPort) {
    const port = parseInt(String(httpPort), 10) || 3000;
    await startHttpTransport(port);
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`[tkassa-mcp] Server started (stdio). ${TOOL_COUNT} tools. Production-grade T-Kassa MCP.`);
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
      res.end(JSON.stringify({ status: "ok", tools: TOOL_COUNT, transport: "streamable-http" }));
      return;
    }
    if (req.url === "/mcp") { await transport.handleRequest(req, res); return; }
    res.writeHead(404); res.end("Not found. Use /mcp or /health.");
  });
  await server.connect(transport);
  httpServer.listen(port, () => {
    console.error(`[tkassa-mcp] HTTP server on port ${port}. ${TOOL_COUNT} tools available.`);
  });
}

const isDirectRun = process.argv[1]?.endsWith("index.js") || process.argv[1]?.endsWith("index.ts");
if (isDirectRun) {
  main().catch((error) => { console.error("[tkassa-mcp] Startup error:", error); process.exit(1); });
}

export { server };
