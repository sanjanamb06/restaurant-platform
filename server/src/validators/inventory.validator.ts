import { z } from "zod";

// ---------------------------------------------------------------------------
// Route param: /api/inventory/:ingredientId
// ---------------------------------------------------------------------------

export const inventoryIngredientParamSchema = z.object({
  ingredientId: z.string().min(1, "ingredientId is required"),
});

// ---------------------------------------------------------------------------
// POST /api/inventory/:ingredientId/adjust — request body
// ---------------------------------------------------------------------------

export const adjustStockSchema = z.object({
  /** Positive number = top-up; negative = manual deduction */
  changeAmount: z
    .number({ required_error: "changeAmount is required" })
    .refine((v) => v !== 0, { message: "changeAmount must not be zero" }),
  /** Optional note explaining the adjustment */
  note: z.string().trim().max(255).optional(),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

// ---------------------------------------------------------------------------
// GET /api/inventory/history — pagination query
// ---------------------------------------------------------------------------

export const stockHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  ingredientId: z.string().optional(),
});

export type StockHistoryQuery = z.infer<typeof stockHistoryQuerySchema>;
