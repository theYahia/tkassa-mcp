import { z } from "zod";
import { TKassaClient } from "../client.js";

const client = new TKassaClient();

// --- Schemas ---

export const addCustomerSchema = z.object({
  customer_key: z.string().describe("Уникальный идентификатор покупателя в вашей системе"),
  email: z.string().email().optional().describe("Email покупателя"),
  phone: z.string().optional().describe("Телефон покупателя (формат +71234567890)"),
});

export const getCustomerSchema = z.object({
  customer_key: z.string().describe("Идентификатор покупателя"),
});

export const removeCustomerSchema = z.object({
  customer_key: z.string().describe("Идентификатор покупателя для удаления"),
});

export const getCardListSchema = z.object({
  customer_key: z.string().describe("Идентификатор покупателя для получения списка сохранённых карт"),
});

export const removeCardSchema = z.object({
  customer_key: z.string().describe("Идентификатор покупателя"),
  card_id: z.number().describe("ID карты для удаления (из get_card_list)"),
});

// --- Handlers ---

export async function handleAddCustomer(params: z.infer<typeof addCustomerSchema>): Promise<string> {
  const body: Record<string, unknown> = { CustomerKey: params.customer_key };
  if (params.email) body.Email = params.email;
  if (params.phone) body.Phone = params.phone;

  const result = await client.post("/AddCustomer", body);
  return JSON.stringify(result, null, 2);
}

export async function handleGetCustomer(params: z.infer<typeof getCustomerSchema>): Promise<string> {
  const result = await client.post("/GetCustomer", { CustomerKey: params.customer_key });
  return JSON.stringify(result, null, 2);
}

export async function handleRemoveCustomer(params: z.infer<typeof removeCustomerSchema>): Promise<string> {
  const result = await client.post("/RemoveCustomer", { CustomerKey: params.customer_key });
  return JSON.stringify(result, null, 2);
}

export async function handleGetCardList(params: z.infer<typeof getCardListSchema>): Promise<string> {
  const result = await client.post("/GetCardList", { CustomerKey: params.customer_key });
  return JSON.stringify(result, null, 2);
}

export async function handleRemoveCard(params: z.infer<typeof removeCardSchema>): Promise<string> {
  const body: Record<string, unknown> = {
    CustomerKey: params.customer_key,
    CardId: params.card_id,
  };

  const result = await client.post("/RemoveCard", body);
  return JSON.stringify(result, null, 2);
}
