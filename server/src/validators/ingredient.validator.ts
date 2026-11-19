import { z } from "zod";

export const ingredientIdParamSchema = z.object({
  id: z.string().min(1, "Ingredient ID is required"),
});

export const createIngredientSchema = z.object({
  name: z.string().trim().min(2).max(100),
  unit: z.string().trim().min(1).max(50),
  currentStock: z.number().nonnegative().optional(),
  lowStockThreshold: z.number().nonnegative().nullable().optional(),
});

export const updateIngredientSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    unit: z.string().trim().min(1).max(50).optional(),
    currentStock: z.number().nonnegative().optional(),
    lowStockThreshold: z.number().nonnegative().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
