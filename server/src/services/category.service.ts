import { prisma } from "../config/env";
import { AppError } from "../middleware/errorHandler";

export interface CreateCategoryInput {
  name: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
}

const categorySelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function findCategoryOrThrow(id: string, restaurantId: string) {
  const category = await prisma.category.findFirst({
    where: { id, restaurantId, deletedAt: null },
  });

  if (!category) {
    throw new AppError(404, "Category not found");
  }

  return category;
}

export function listCategories(restaurantId: string) {
  return prisma.category.findMany({
    where: { restaurantId, deletedAt: null },
    select: categorySelect,
    orderBy: { name: "asc" },
  });
}

export async function getCategory(id: string, restaurantId: string) {
  return findCategoryOrThrow(id, restaurantId);
}

export async function createCategory(restaurantId: string, input: CreateCategoryInput) {
  return prisma.category.create({
    data: {
      restaurantId,
      name: input.name,
      description: input.description,
    },
    select: categorySelect,
  });
}

export async function updateCategory(
  id: string,
  restaurantId: string,
  input: UpdateCategoryInput,
) {
  await findCategoryOrThrow(id, restaurantId);

  return prisma.category.update({
    where: { id },
    data: input,
    select: categorySelect,
  });
}

export async function deleteCategory(id: string, restaurantId: string) {
  await findCategoryOrThrow(id, restaurantId);

  const menuItemCount = await prisma.menuItem.count({
    where: {
      categoryId: id,
      restaurantId,
      deletedAt: null,
    },
  });

  if (menuItemCount > 0) {
    throw new AppError(
      409,
      "This category still has menu items in it. Move or delete them first.",
    );
  }

  return prisma.category.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: categorySelect,
  });
}
