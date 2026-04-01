import { z } from "zod";
import { TKassaClient, toKopecks } from "../client.js";

const client = new TKassaClient();

// --- Receipt item schema (54-FZ) ---
const receiptItemSchema = z.object({
  Name: z.string().max(128).describe("Название товара/услуги (макс 128 символов)"),
  Price: z.number().positive().describe("Цена за единицу в рублях"),
  Quantity: z.number().positive().describe("Количество"),
  Amount: z.number().positive().describe("Сумма позиции в рублях"),
  Tax: z.enum(["none", "vat0", "vat10", "vat20", "vat110", "vat120"]).describe("Ставка НДС"),
  PaymentMethod: z.enum(["full_prepayment", "prepayment", "advance", "full_payment", "partial_payment", "credit", "credit_payment"]).default("full_payment").optional().describe("Способ расчёта"),
  PaymentObject: z.enum(["commodity", "excise", "job", "service", "gambling_bet", "gambling_prize", "lottery", "lottery_prize", "intellectual_activity", "payment", "agent_commission", "composite", "another"]).default("commodity").optional().describe("Предмет расчёта"),
});

const receiptSchema = z.object({
  Email: z.string().email().optional().describe("Email покупателя для чека"),
  Phone: z.string().optional().describe("Телефон покупателя для чека"),
  Taxation: z.enum(["osn", "usn_income", "usn_income_outcome", "envd", "esn", "patent"]).describe("Система налогообложения"),
  Items: z.array(receiptItemSchema).min(1).describe("Позиции чека"),
});

// --- Schemas ---

export const initPaymentSchema = z.object({
  amount: z.number().positive().describe("Сумма платежа в рублях (например 100.50)"),
  order_id: z.string().describe("Уникальный идентификатор заказа в вашей системе"),
  description: z.string().max(250).optional().describe("Описание платежа (макс 250 символов)"),
  customer_key: z.string().optional().describe("Идентификатор покупателя для сохранения карт и рекуррентов"),
  recurrent: z.enum(["Y"]).optional().describe("Признак рекуррентного платежа (Y)"),
  pay_type: z.enum(["O", "T"]).optional().describe("Тип оплаты: O — одностадийная, T — двухстадийная"),
  language: z.enum(["ru", "en"]).default("ru").describe("Язык платежной формы"),
  notification_url: z.string().url().optional().describe("URL для уведомлений"),
  success_url: z.string().url().optional().describe("URL при успешной оплате"),
  fail_url: z.string().url().optional().describe("URL при неуспешной оплате"),
  receipt: receiptSchema.optional().describe("Данные чека для 54-ФЗ"),
  data: z.record(z.string()).optional().describe("Дополнительные параметры (DATA). Ключ-значение, строки."),
});

export const getStateSchema = z.object({
  payment_id: z.string().describe("ID платежа в системе T-Kassa"),
});

export const confirmSchema = z.object({
  payment_id: z.string().describe("ID платежа для подтверждения (двухстадийный)"),
  amount: z.number().positive().optional().describe("Сумма подтверждения в рублях (для частичного подтверждения)"),
});

export const cancelSchema = z.object({
  payment_id: z.string().describe("ID платежа для отмены"),
  amount: z.number().positive().optional().describe("Сумма отмены в рублях (для частичной отмены)"),
});

export const chargeSchema = z.object({
  payment_id: z.string().describe("ID платежа, полученный после Init с Recurrent=Y"),
  rebill_id: z.string().describe("ID рекуррентного платежа (из GetCardList или уведомления)"),
});

// --- Handlers ---

export async function handleInitPayment(params: z.infer<typeof initPaymentSchema>): Promise<string> {
  const body: Record<string, unknown> = {
    Amount: toKopecks(params.amount),
    OrderId: params.order_id,
    Language: params.language,
  };

  if (params.description) body.Description = params.description;
  if (params.customer_key) body.CustomerKey = params.customer_key;
  if (params.recurrent) body.Recurrent = params.recurrent;
  if (params.pay_type) body.PayType = params.pay_type;
  if (params.notification_url) body.NotificationURL = params.notification_url;
  if (params.success_url) body.SuccessURL = params.success_url;
  if (params.fail_url) body.FailURL = params.fail_url;
  if (params.data) body.DATA = params.data;

  if (params.receipt) {
    body.Receipt = {
      ...params.receipt,
      Items: params.receipt.Items.map(item => ({
        ...item,
        Price: toKopecks(item.Price),
        Amount: toKopecks(item.Amount),
      })),
    };
  }

  const result = await client.post("/Init", body);
  return JSON.stringify(result, null, 2);
}

export async function handleGetState(params: z.infer<typeof getStateSchema>): Promise<string> {
  const result = await client.post("/GetState", { PaymentId: params.payment_id });
  return JSON.stringify(result, null, 2);
}

export async function handleConfirm(params: z.infer<typeof confirmSchema>): Promise<string> {
  const body: Record<string, unknown> = { PaymentId: params.payment_id };
  if (params.amount) body.Amount = toKopecks(params.amount);

  const result = await client.post("/Confirm", body);
  return JSON.stringify(result, null, 2);
}

export async function handleCancel(params: z.infer<typeof cancelSchema>): Promise<string> {
  const body: Record<string, unknown> = { PaymentId: params.payment_id };
  if (params.amount) body.Amount = toKopecks(params.amount);

  const result = await client.post("/Cancel", body);
  return JSON.stringify(result, null, 2);
}

export async function handleCharge(params: z.infer<typeof chargeSchema>): Promise<string> {
  const body: Record<string, unknown> = {
    PaymentId: params.payment_id,
    RebillId: params.rebill_id,
  };

  const result = await client.post("/Charge", body);
  return JSON.stringify(result, null, 2);
}
