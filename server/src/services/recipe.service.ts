import { prisma } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { findMenuItemOrThrow, serializeRecipeEntry } from "./menuItem.service";

export interface AddRecipeIngredientInput {
  ingredientId: string;
  quantity: number;
}

export interface UpdateRecipeIngredientInput {
  quantity: number;
}

async function validateIngredient(ingredientId: string, restaurantId: string) {
  const ingredient = await prisma.ingredient.findFirst({
    where: { id: ingredientId, restaurantId, deletedAt: null },
    select: { id: true },
  });

  if (!ingredient) {
    throw new AppError(400, "Ingredient not found or unavailable");
  }
}

export async function listRecipeIngredients(menuItemId: string, restaurantId: string) {
  await findMenuItemOrThrow(menuItemId, restaurantId);

  const entries = await prisma.menuItemIngredient.findMany({
    where: { menuItemId, restaurantId },
    include: {
      ingredient: {
        select: {
          id: true,
          name: true,
          unit: true,
        },
      },
    },
    orderBy: { ingredient: { name: "asc" } },
  });

  return entries.map(serializeRecipeEntry);
}

export async function addRecipeIngredient(
  menuItemId: string,
  restaurantId: string,
  input: AddRecipeIngredientInput,
) {
  await findMenuItemOrThrow(menuItemId, restaurantId);
  await validateIngredient(input.ingredientId, restaurantId);

  const existing = await prisma.menuItemIngredient.findUnique({
    where: {
      menuItemId_ingredientId: {
        menuItemId,
        ingredientId: input.ingredientId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(
      409,
      "This ingredient is already in the recipe. Use PATCH to update the quantity instead.",
    );
  }

  const entry = await prisma.menuItemIngredient.create({
    data: {
      restaurantId,
      menuItemId,
      ingredientId: input.ingredientId,
      quantity: input.quantity,
    },
    include: {
      ingredient: {
        select: {
          id: true,
          name: true,
          unit: true,
        },
      },
    },
  });

  return serializeRecipeEntry(entry);
}

export async function updateRecipeIngredient(
  menuItemId: string,
  ingredientId: string,
  restaurantId: string,
  input: UpdateRecipeIngredientInput,
) {
  await findMenuItemOrThrow(menuItemId, restaurantId);

  const existing = await prisma.menuItemIngredient.findFirst({
    where: { menuItemId, ingredientId, restaurantId },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, "Recipe ingredient not found");
  }

  const entry = await prisma.menuItemIngredient.update({
    where: { id: existing.id },
    data: { quantity: input.quantity },
    include: {
      ingredient: {
        select: {
          id: true,
          name: true,
          unit: true,
        },
      },
    },
  });

  return serializeRecipeEntry(entry);
}

export async function removeRecipeIngredient(
  menuItemId: string,
  ingredientId: string,
  restaurantId: string,
) {
  await findMenuItemOrThrow(menuItemId, restaurantId);

  const existing = await prisma.menuItemIngredient.findFirst({
    where: { menuItemId, ingredientId, restaurantId },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, "Recipe ingredient not found");
  }

  await prisma.menuItemIngredient.delete({
    where: { id: existing.id },
  });
}
