import { prisma } from "../config/env";
import { AppError } from "../middleware/errorHandler";

export interface CreateIngredientInput {
  name: string;
  unit: string;
  currentStock?: number;
  lowStockThreshold?: number | null;
}

export interface UpdateIngredientInput {
  name?: string;
  unit?: string;
  currentStock?: number;
  lowStockThreshold?: number | null;
}

const ingredientSelect = {
  id: true,
  name: true,
  unit: true,
  currentStock: true,
  lowStockThreshold: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function findIngredientOrThrow(id: string, restaurantId: string) {
  const ingredient = await prisma.ingredient.findFirst({
    where: { id, restaurantId, deletedAt: null },
  });

  if (!ingredient) {
    throw new AppError(404, "Ingredient not found");
  }

  return ingredient;
}

export function listIngredients(restaurantId: string) {
  return prisma.ingredient.findMany({
    where: { restaurantId, deletedAt: null },
    select: ingredientSelect,
    orderBy: { name: "asc" },
  });
}

export async function getIngredient(id: string, restaurantId: string) {
  return findIngredientOrThrow(id, restaurantId);
}

export async function createIngredient(restaurantId: string, input: CreateIngredientInput) {
  return prisma.ingredient.create({
    data: {
      restaurantId,
      name: input.name,
      unit: input.unit,
      currentStock: input.currentStock ?? 0,
      lowStockThreshold: input.lowStockThreshold ?? null,
    },
    select: ingredientSelect,
  });
}

export async function updateIngredient(
  id: string,
  restaurantId: string,
  input: UpdateIngredientInput,
) {
  await findIngredientOrThrow(id, restaurantId);

  if (input.unit !== undefined) {
    const usedInRecipe = await prisma.menuItemIngredient.findFirst({
      where: {
        ingredientId: id,
        restaurantId,
        menuItem: { deletedAt: null },
      },
      select: { id: true },
    });

    if (usedInRecipe) {
      throw new AppError(
        409,
        "Can't change the unit for an ingredient already used in recipes. This could break existing quantities.",
      );
    }
  }

  return prisma.ingredient.update({
    where: { id },
    data: input,
    select: ingredientSelect,
  });
}

export async function deleteIngredient(id: string, restaurantId: string) {
  await findIngredientOrThrow(id, restaurantId);

  const usedInRecipe = await prisma.menuItemIngredient.findFirst({
    where: {
      ingredientId: id,
      restaurantId,
      menuItem: { deletedAt: null },
    },
    select: { id: true },
  });

  if (usedInRecipe) {
    throw new AppError(
      409,
      "This ingredient is used in one or more recipes. Remove it from those recipes first.",
    );
  }

  return prisma.ingredient.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: ingredientSelect,
  });
}
