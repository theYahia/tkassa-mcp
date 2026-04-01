import { z } from "zod";
import { TKassaClient, toKopecks } from "../client.js";

const client = new TKassaClient();

// --- Schema ---

export const refundPaymentSchema = z.object({
  payment_id: z.string().describe("ID платежа для возврата в системе T-Kassa"),
  amount: z.number().positive().optional().describe("Сумма возврата в рублях (для частичного возврата). Если не указана -- полный возврат."),
});

// --- Handler ---

export async function handleRefundPayment(params: z.infer<typeof refundPaymentSchema>): Promise<string> {
  const body: Record<string, unknown> = { PaymentId: params.payment_id };
  if (params.amount) body.Amount = toKopecks(params.amount);

  const result = await client.post("/Cancel", body);
  return JSON.stringify(result, null, 2);
}
