import { z } from "zod";
import { TKassaClient } from "../client.js";

const client = new TKassaClient();

// --- Schemas ---

export const createSbpQrSchema = z.object({
  payment_id: z.string().describe("ID платежа (из init_payment) для генерации QR-кода СБП"),
  data_type: z.enum(["PAYLOAD", "IMAGE"]).default("PAYLOAD").describe("Тип возвращаемых данных: PAYLOAD (ссылка для QR) или IMAGE (base64 PNG)"),
});

export const getSbpQrStateSchema = z.object({
  payment_id: z.string().describe("ID платежа для проверки статуса QR-кода СБП"),
});

// --- Handlers ---

export async function handleCreateSbpQr(params: z.infer<typeof createSbpQrSchema>): Promise<string> {
  const body: Record<string, unknown> = {
    PaymentId: params.payment_id,
    DataType: params.data_type,
  };

  const result = await client.post("/SbpPayTest", body);
  return JSON.stringify(result, null, 2);
}

export async function handleGetSbpQrState(params: z.infer<typeof getSbpQrStateSchema>): Promise<string> {
  const result = await client.post("/SbpPayTest", { PaymentId: params.payment_id });
  return JSON.stringify(result, null, 2);
}
