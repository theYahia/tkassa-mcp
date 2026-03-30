import { z } from "zod";
import { TKassaClient, toKopecks } from "../client.js";

const client = new TKassaClient();

// --- Schemas ---

export const initPaymentSchema = z.object({
  amount: z.number().positive().describe("Сумма платежа в рублях (например 100.50)"),
  order_id: z.string().describe("Уникальный идентификатор заказа в вашей системе"),
  description: z.string().max(250).optional().describe("Описание платежа (макс 250 символов)"),
  customer_key: z.string().optional().describe("Идентификатор покупателя в вашей системе"),
  recurrent: z.enum(["Y"]).optional().describe("Признак рекуррентного платежа (Y)"),
  language: z.enum(["ru", "en"]).default("ru").describe("Язык платежной формы"),
  notification_url: z.string().url().optional().describe("URL для уведомлений"),
  success_url: z.string().url().optional().describe("URL при успешной оплате"),
  fail_url: z.string().url().optional().describe("URL при неуспешной оплате"),
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
  if (params.notification_url) body.NotificationURL = params.notification_url;
  if (params.success_url) body.SuccessURL = params.success_url;
  if (params.fail_url) body.FailURL = params.fail_url;

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
