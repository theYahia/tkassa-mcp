export interface TKassaResponse {
  Success: boolean;
  ErrorCode: string;
  TerminalKey?: string;
  Status?: string;
  PaymentId?: string;
  OrderId?: string;
  Amount?: number;
  Message?: string;
  Details?: string;
  PaymentURL?: string;
  OriginalAmount?: number;
  NewAmount?: number;
  // Customer fields
  CustomerKey?: string;
  Email?: string;
  Phone?: string;
  // Card list fields
  CardId?: number;
  Pan?: string;
  ExpDate?: string;
  CardType?: number;
  RebillId?: string;
  // SBP fields
  Data?: string;
  // Generic payload for extended responses
  [key: string]: unknown;
}
