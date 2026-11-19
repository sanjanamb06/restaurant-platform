import { Prisma } from "@prisma/client";
import { prisma } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { ListMenuItemsQuery } from "../validators/menuItem.validator";

export interface CreateMenuItemInput {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  imageUrl?: string | null;
  isAvailable?: boolean;
}

export interface UpdateMenuItemInput {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  imageUrl?: string | null;
  isAvailable?: boolean;
}

const recipeInclude = {
  ingredients: {
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
  },
} satisfies Prisma.MenuItemInclude;

const menuItemInclude = {
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  ...recipeInclude,
} satisfies Prisma.MenuItemInclude;

function serializeRecipeEntry(entry: {
  id: string;
  ingredientId: string;
  quantity: number;
  ingredient: { id: string; name: string; unit: string };
}) {
  return {
    id: entry.id,
    ingredientId: entry.ingredientId,
    quantity: entry.quantity,
    unit: entry.ingredient.unit,
    ingredient: entry.ingredient,
  };
}

function serializeMenuItem(
  item: Prisma.MenuItemGetPayload<{ include: typeof menuItemInclude }>,
) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    categoryId: item.categoryId,
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    category: item.category,
    ingredients: item.ingredients.map(serializeRecipeEntry),
  };
}

async function findMenuItemOrThrow(id: string, restaurantId: string) {
  const menuItem = await prisma.menuItem.findFirst({
    where: { id, restaurantId, deletedAt: null },
    include: menuItemInclude,
  });

  if (!menuItem) {
    throw new AppError(404, "Menu item not found");
  }

  return menuItem;
}

async function validateCategory(categoryId: string, restaurantId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, restaurantId, deletedAt: null },
    select: { id: true },
  });

  if (!category) {
    throw new AppError(400, "Category not found or unavailable");
  }
}

export async function listMenuItems(restaurantId: string, query: ListMenuItemsQuery) {
  const where: Prisma.MenuItemWhereInput = {
    restaurantId,
    deletedAt: null,
  };

  if (query.search) {
    where.name = { contains: query.search, mode: "insensitive" };
  }

  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }

  if (query.available !== undefined) {
    where.isAvailable = query.available;
  }

  const items = await prisma.menuItem.findMany({
    where,
    include: menuItemInclude,
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  return items.map(serializeMenuItem);
}

export async function getMenuItem(id: string, restaurantId: string) {
  const menuItem = await findMenuItemOrThrow(id, restaurantId);
  return serializeMenuItem(menuItem);
}

export async function createMenuItem(restaurantId: string, input: CreateMenuItemInput) {
  await validateCategory(input.categoryId, restaurantId);

  const menuItem = await prisma.menuItem.create({
    data: {
      restaurantId,
      name: input.name,
      description: input.description,
      price: input.price,
      categoryId: input.categoryId,
      imageUrl: input.imageUrl ?? null,
      isAvailable: input.isAvailable ?? true,
    },
    include: menuItemInclude,
  });

  return serializeMenuItem(menuItem);
}

export async function updateMenuItem(
  id: string,
  restaurantId: string,
  input: UpdateMenuItemInput,
) {
  await findMenuItemOrThrow(id, restaurantId);

  if (input.categoryId) {
    await validateCategory(input.categoryId, restaurantId);
  }

  const menuItem = await prisma.menuItem.update({
    where: { id },
    data: input,
    include: menuItemInclude,
  });

  return serializeMenuItem(menuItem);
}

export async function deleteMenuItem(id: string, restaurantId: string) {
  await findMenuItemOrThrow(id, restaurantId);

  return prisma.menuItem.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true },
  });
}

export { findMenuItemOrThrow, serializeRecipeEntry };
