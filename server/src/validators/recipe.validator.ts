import { z } from "zod";

const quantitySchema = z
  .number({ invalid_type_error: "Quantity must be a number" })
  .positive("Quantity must be a positive number");

export const recipeMenuItemParamSchema = z.object({
  id: z.string().min(1, "Menu item ID is required"),
});

export const recipeIngredientParamSchema = z.object({
  id: z.string().min(1, "Menu item ID is required"),
  ingredientId: z.string().min(1, "Ingredient ID is required"),
});

export const addRecipeIngredientSchema = z.object({
  ingredientId: z.string().min(1, "Ingredient ID is required"),
  quantity: quantitySchema,
});

export const updateRecipeIngredientSchema = z.object({
  quantity: quantitySchema,
});
