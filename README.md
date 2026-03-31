# @theyahia/tkassa-mcp

MCP server for **T-Kassa** (T-Bank/Tinkoff) payment API. 5 tools for payments, confirmation, cancellation, and refunds.

[![npm](https://img.shields.io/npm/v/@theyahia/tkassa-mcp)](https://www.npmjs.com/package/@theyahia/tkassa-mcp)
[![license](https://img.shields.io/npm/l/@theyahia/tkassa-mcp)](./LICENSE)

## Quick Start

### Claude Desktop

```json
{
  "mcpServers": {
    "tkassa": {
      "command": "npx",
      "args": ["-y", "@theyahia/tkassa-mcp"],
      "env": {
        "TKASSA_TERMINAL_KEY": "your-terminal-key",
        "TKASSA_PASSWORD": "your-password"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add tkassa -e TKASSA_TERMINAL_KEY=key -e TKASSA_PASSWORD=pass -- npx -y @theyahia/tkassa-mcp
```

### Cursor / Windsurf

```json
{
  "tkassa": {
    "command": "npx",
    "args": ["-y", "@theyahia/tkassa-mcp"],
    "env": {
      "TKASSA_TERMINAL_KEY": "your-terminal-key",
      "TKASSA_PASSWORD": "your-password"
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `init_payment` | Initialize payment, returns PaymentURL |
| `get_state` | Get payment status by PaymentId |
| `confirm_payment` | Confirm two-stage payment (partial OK) |
| `cancel_payment` | Cancel payment before/after confirmation |
| `refund_payment` | Full or partial refund |

## Auth

| Variable | Required | Description |
|----------|----------|-------------|
| `TKASSA_TERMINAL_KEY` | Yes | Terminal key from T-Kassa dashboard |
| `TKASSA_PASSWORD` | Yes | Terminal password for request signing |

## HTTP Transport

```bash
HTTP_PORT=3000 npx @theyahia/tkassa-mcp
# or
npx @theyahia/tkassa-mcp --http 3000
```

Endpoints: `POST /mcp` (JSON-RPC), `GET /health` (status).

## Skills

- **skill-create-payment** -- create a payment and get a payment URL
- **skill-payment-status** -- check payment status by PaymentId

## Notes

- Amounts are passed in rubles, converted to kopecks internally
- All requests signed with SHA-256 token
- Automatic retry with exponential backoff on 429/5xx

## License

MIT
