import { z } from "zod";

// ---------------------------------------------------------------------------
// Supported payment methods
// ---------------------------------------------------------------------------

export const PAYMENT_METHODS = ["CASH", "UPI", "CARD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// ---------------------------------------------------------------------------
// Route param: /api/billing/:orderId
// ---------------------------------------------------------------------------

export const billingOrderParamSchema = z.object({
  orderId: z.string().min(1, "orderId is required"),
});

// ---------------------------------------------------------------------------
// POST /api/billing/:orderId/pay  — request body
// ---------------------------------------------------------------------------

export const payBillSchema = z.object({
  method: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: "method must be CASH, UPI, or CARD" }),
  }),
});

export type PayBillInput = z.infer<typeof payBillSchema>;
