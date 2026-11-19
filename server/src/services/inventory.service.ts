import { Prisma, StockChangeReason } from "@prisma/client";
import { prisma } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { getIO } from "../socket";
import type { AdjustStockInput, StockHistoryQuery } from "../validators/inventory.validator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LowStockAlert {
  ingredientId: string;
  name: string;
  unit: string;
  currentStock: number;
  lowStockThreshold: number;
  shortfall: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildLowStockAlert(ingredient: {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  lowStockThreshold: number | null;
}): LowStockAlert | null {
  if (
    ingredient.lowStockThreshold !== null &&
    ingredient.currentStock < ingredient.lowStockThreshold
  ) {
    return {
      ingredientId: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      currentStock: ingredient.currentStock,
      lowStockThreshold: ingredient.lowStockThreshold,
      shortfall: parseFloat(
        (ingredient.lowStockThreshold - ingredient.currentStock).toFixed(3),
      ),
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Service: getCurrentStock
// ---------------------------------------------------------------------------

/**
 * Returns all ingredients for the restaurant with a low-stock flag.
 * Accessible by all authenticated roles.
 */
export async function getCurrentStock(restaurantId: string) {
  const ingredients = await prisma.ingredient.findMany({
    where: { restaurantId, deletedAt: null },
    select: {
      id: true,
      name: true,
      unit: true,
      currentStock: true,
      lowStockThreshold: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });

  return ingredients.map((ing) => ({
    ...ing,
    isLowStock:
      ing.lowStockThreshold !== null &&
      ing.currentStock < ing.lowStockThreshold,
  }));
}

// ---------------------------------------------------------------------------
// Service: getLowStockAlerts
// ---------------------------------------------------------------------------

/**
 * Returns only ingredients currently below their low-stock threshold.
 */
export async function getLowStockAlerts(
  restaurantId: string,
): Promise<LowStockAlert[]> {
  const ingredients = await prisma.ingredient.findMany({
    where: { restaurantId, deletedAt: null },
    select: {
      id: true,
      name: true,
      unit: true,
      currentStock: true,
      lowStockThreshold: true,
    },
  });

  return ingredients
    .map(buildLowStockAlert)
    .filter((a): a is LowStockAlert => a !== null)
    .sort((a, b) => a.shortfall - b.shortfall); // worst shortage first
}

// ---------------------------------------------------------------------------
// Service: getStockHistory
// ---------------------------------------------------------------------------

/**
 * Paginated stock-change history, newest first.
 * Optionally filter by a specific ingredient.
 */
export async function getStockHistory(
  restaurantId: string,
  query: StockHistoryQuery,
) {
  const where: Prisma.StockHistoryWhereInput = { restaurantId };
  if (query.ingredientId) where.ingredientId = query.ingredientId;

  const [total, entries] = await prisma.$transaction([
    prisma.stockHistory.count({ where }),
    prisma.stockHistory.findMany({
      where,
      include: {
        ingredient: {
          select: { id: true, name: true, unit: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
    entries: entries.map((e) => ({
      id: e.id,
      ingredientId: e.ingredientId,
      ingredientName: e.ingredient.name,
      unit: e.ingredient.unit,
      changeAmount: e.changeAmount,
      reason: e.reason,
      referenceId: e.referenceId,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

// ---------------------------------------------------------------------------
// Service: adjustStock (manual)
// ---------------------------------------------------------------------------

/**
 * Manual stock adjustment by a manager.
 * Positive changeAmount = top-up; negative = manual deduction.
 * Stock is clamped to 0 (cannot go negative).
 */
export async function adjustStock(
  restaurantId: string,
  ingredientId: string,
  input: AdjustStockInput,
) {
  const ingredient = await prisma.ingredient.findFirst({
    where: { id: ingredientId, restaurantId, deletedAt: null },
    select: {
      id: true,
      name: true,
      unit: true,
      currentStock: true,
      lowStockThreshold: true,
    },
  });

  if (!ingredient) {
    throw new AppError(404, "Ingredient not found");
  }

  const newStock = Math.max(0, ingredient.currentStock + input.changeAmount);

  const [updated] = await prisma.$transaction([
    prisma.ingredient.update({
      where: { id: ingredientId },
      data: { currentStock: newStock },
      select: {
        id: true,
        name: true,
        unit: true,
        currentStock: true,
        lowStockThreshold: true,
        updatedAt: true,
      },
    }),
    prisma.stockHistory.create({
      data: {
        restaurantId,
        ingredientId,
        changeAmount: input.changeAmount,
        reason: StockChangeReason.MANUAL_ADJUSTMENT,
        referenceId: null,
      },
    }),
  ]);

  // Fire low-stock Socket.IO event if threshold crossed after adjustment
  const alert = buildLowStockAlert({
    ...updated,
    lowStockThreshold: updated.lowStockThreshold,
  });

  if (alert) {
    try {
      getIO()
        .to(`restaurant:${restaurantId}`)
        .emit("inventory:lowStock", { alerts: [alert] });
    } catch {
      console.warn("Socket.IO not initialised — skipping inventory:lowStock emit");
    }
  }

  return {
    ...updated,
    isLowStock: alert !== null,
  };
}

// ---------------------------------------------------------------------------
// Service: deductStockForOrder (called inside billing transaction)
// ---------------------------------------------------------------------------

/**
 * Deducts ingredients consumed by the given order.
 * MUST be called inside an existing Prisma transaction (tx).
 *
 * Algorithm:
 *  1. Load all OrderItems for the order.
 *  2. For each OrderItem, load its MenuItemIngredient recipe rows.
 *  3. Accumulate total deduction per ingredient across all items.
 *  4. Update each ingredient's currentStock (clamped to 0).
 *  5. Insert StockHistory rows for the deduction audit trail.
 *  6. Return list of ingredients that fell below threshold (for Socket.IO).
 *
 * Items with no recipe mapping are silently skipped.
 */
export async function deductStockForOrder(
  tx: Prisma.TransactionClient,
  restaurantId: string,
  orderId: string,
): Promise<LowStockAlert[]> {
  // 1. Load order items
  const orderItems = await tx.orderItem.findMany({
    where: { orderId, restaurantId },
    select: { menuItemId: true, quantity: true },
  });

  if (orderItems.length === 0) return [];

  // 2. Load recipe mappings for all menuItemIds in this order
  const menuItemIds = orderItems.map((oi) => oi.menuItemId);

  const recipeMappings = await tx.menuItemIngredient.findMany({
    where: { menuItemId: { in: menuItemIds }, restaurantId },
    select: { menuItemId: true, ingredientId: true, quantity: true },
  });

  if (recipeMappings.length === 0) return []; // No recipes configured — skip silently

  // 3. Accumulate total deduction per ingredient
  const deductionMap = new Map<string, number>(); // ingredientId → total units to deduct

  for (const orderItem of orderItems) {
    const itemRecipes = recipeMappings.filter(
      (r) => r.menuItemId === orderItem.menuItemId,
    );
    for (const recipe of itemRecipes) {
      const current = deductionMap.get(recipe.ingredientId) ?? 0;
      deductionMap.set(
        recipe.ingredientId,
        current + recipe.quantity * orderItem.quantity,
      );
    }
  }

  if (deductionMap.size === 0) return [];

  // 4. Load current stock for affected ingredients
  const ingredientIds = Array.from(deductionMap.keys());
  const ingredients = await tx.ingredient.findMany({
    where: { id: { in: ingredientIds }, restaurantId },
    select: {
      id: true,
      name: true,
      unit: true,
      currentStock: true,
      lowStockThreshold: true,
    },
  });

  // 5. Update each ingredient + create StockHistory rows
  const lowStockAlerts: LowStockAlert[] = [];

  await Promise.all(
    ingredients.map(async (ing) => {
      const deduction = deductionMap.get(ing.id) ?? 0;
      const newStock = Math.max(0, ing.currentStock - deduction);

      await tx.ingredient.update({
        where: { id: ing.id },
        data: { currentStock: newStock },
      });

      await tx.stockHistory.create({
        data: {
          restaurantId,
          ingredientId: ing.id,
          changeAmount: -deduction, // negative = deduction
          reason: StockChangeReason.ORDER_DEDUCTION,
          referenceId: orderId,
        },
      });

      // 6. Collect low-stock alerts
      const alert = buildLowStockAlert({ ...ing, currentStock: newStock });
      if (alert) lowStockAlerts.push(alert);
    }),
  );

  return lowStockAlerts;
}

// ---------------------------------------------------------------------------
// Service: getInventorySummary
// ---------------------------------------------------------------------------

/**
 * Aggregate stats for the inventory dashboard header.
 */
export async function getInventorySummary(restaurantId: string) {
  const [totalIngredients, allIngredients, lastDeduction] = await Promise.all([
    prisma.ingredient.count({ where: { restaurantId, deletedAt: null } }),
    prisma.ingredient.findMany({
      where: { restaurantId, deletedAt: null },
      select: { currentStock: true, lowStockThreshold: true },
    }),
    prisma.stockHistory.findFirst({
      where: { restaurantId, reason: StockChangeReason.ORDER_DEDUCTION },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const lowStockCount = allIngredients.filter(
    (i) =>
      i.lowStockThreshold !== null && i.currentStock < i.lowStockThreshold,
  ).length;

  const outOfStockCount = allIngredients.filter(
    (i) => i.currentStock === 0,
  ).length;

  return {
    totalIngredients,
    lowStockCount,
    outOfStockCount,
    lastDeductionAt: lastDeduction?.createdAt.toISOString() ?? null,
  };
}
