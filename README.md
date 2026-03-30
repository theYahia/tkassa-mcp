# @theyahia/tkassa-mcp

MCP-сервер для T-Kassa (T-Bank/Tinkoff) API — платежи, возвраты. **5 инструментов.** Первый MCP-сервер для T-Kassa.

[![npm](https://img.shields.io/npm/v/@theyahia/tkassa-mcp)](https://www.npmjs.com/package/@theyahia/tkassa-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Часть серии [Russian API MCP](https://github.com/theYahia/russian-mcp) (50 серверов) by [@theYahia](https://github.com/theYahia).

## Установка

### Claude Desktop

```json
{
  "mcpServers": {
    "tkassa": {
      "command": "npx",
      "args": ["-y", "@theyahia/tkassa-mcp"],
      "env": {
        "TKASSA_TERMINAL_KEY": "ваш-terminal-key",
        "TKASSA_PASSWORD": "ваш-пароль"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add tkassa -e TKASSA_TERMINAL_KEY=ваш-ключ -e TKASSA_PASSWORD=ваш-пароль -- npx -y @theyahia/tkassa-mcp
```

### VS Code / Cursor

```json
{
  "servers": {
    "tkassa": {
      "command": "npx",
      "args": ["-y", "@theyahia/tkassa-mcp"],
      "env": {
        "TKASSA_TERMINAL_KEY": "ваш-terminal-key",
        "TKASSA_PASSWORD": "ваш-пароль"
      }
    }
  }
}
```

### Windsurf

```json
{
  "mcpServers": {
    "tkassa": {
      "command": "npx",
      "args": ["-y", "@theyahia/tkassa-mcp"],
      "env": {
        "TKASSA_TERMINAL_KEY": "ваш-terminal-key",
        "TKASSA_PASSWORD": "ваш-пароль"
      }
    }
  }
}
```

## Переменные окружения

| Переменная | Обязательна | Описание |
|------------|:-----------:|----------|
| `TKASSA_TERMINAL_KEY` | Да | Ключ терминала (Личный кабинет → Магазины → Терминалы) |
| `TKASSA_PASSWORD` | Да | Пароль терминала (для формирования токена подписи) |

Для тестирования используйте тестовый терминал в [личном кабинете T-Kassa](https://www.tbank.ru/kassa/).

## Инструменты (5)

### Платежи (4)

| Инструмент | Описание |
|------------|----------|
| `init_payment` | Инициализировать платёж — сумма, описание, OrderId. Возвращает ссылку на оплату |
| `get_state` | Получить статус платежа по PaymentId |
| `confirm_payment` | Подтвердить платёж (для двухстадийных). Частичное подтверждение |
| `cancel_payment` | Отменить платёж |

### Возвраты (1)

| Инструмент | Описание |
|------------|----------|
| `refund_payment` | Полный или частичный возврат средств по платежу |

## Особенности T-Kassa API

- Все запросы через POST с JSON-телом
- Суммы передаются в копейках (100 руб = 10000)
- Каждый запрос подписывается SHA-256 токеном
- Для возвратов используется тот же endpoint /Cancel

## Примеры запросов

```
Создай платёж на 5000 рублей для заказа order-123
```

```
Проверь статус платежа 123456789
```

```
Подтверди платёж 123456789 на сумму 3000 рублей
```

```
Сделай возврат по платежу 123456789
```

```
Отмени платёж 123456789
```

## Часть серии Russian API MCP

| MCP | Статус | Описание |
|-----|--------|----------|
| [@metarebalance/dadata-mcp](https://github.com/theYahia/dadata-mcp) | готов | Адреса, компании, банки, телефоны |
| [@theyahia/cbr-mcp](https://github.com/theYahia/cbr-mcp) | готов | Курсы валют, ключевая ставка |
| [@theyahia/yookassa-mcp](https://github.com/theYahia/yookassa-mcp) | готов | Платежи, возвраты, чеки 54-ФЗ |
| [@theyahia/tkassa-mcp](https://github.com/theYahia/tkassa-mcp) | готов | Платежи, возвраты T-Kassa |
| ... | скоро | **+46 серверов** — [полный список](https://github.com/theYahia/russian-mcp) |

## Лицензия

MIT
