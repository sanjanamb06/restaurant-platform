import { prisma } from "../config/env";
import { StockChangeReason } from "@prisma/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a date object representing `days` ago from midnight today.
 */
function getDateXDaysAgo(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days + 1);
  return d;
}

/**
 * Formats a Date to YYYY-MM-DD
 */
function formatYYYYMMDD(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Generates an array of all YYYY-MM-DD strings from `startDate` to today.
 * Ensures the chart x-axis has continuous dates even if no sales occurred.
 */
function generateDateRange(startDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    dates.push(formatYYYYMMDD(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ---------------------------------------------------------------------------
// Service: Revenue Analytics
// ---------------------------------------------------------------------------

export async function getRevenueData(restaurantId: string, days: number) {
  const startDate = getDateXDaysAgo(days);

  const payments = await prisma.payment.findMany({
    where: {
      restaurantId,
      status: "PAID",
      createdAt: { gte: startDate },
    },
    select: { amount: true, createdAt: true },
  });

  // Group by YYYY-MM-DD
  const revenueMap = new Map<string, number>();
  for (const p of payments) {
    const dateStr = formatYYYYMMDD(p.createdAt);
    const amount = Number(p.amount) || 0;
    revenueMap.set(dateStr, (revenueMap.get(dateStr) || 0) + amount);
  }

  // Fill all dates in range
  const dateRange = generateDateRange(startDate);
  return dateRange.map((date) => ({
    date,
    revenue: revenueMap.get(date) || 0,
  }));
}

// ---------------------------------------------------------------------------
// Service: Order Volume Analytics
// ---------------------------------------------------------------------------

export async function getOrderVolumeData(restaurantId: string, days: number) {
  const startDate = getDateXDaysAgo(days);

  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: { not: "CANCELLED" }, // exclude cancelled
      createdAt: { gte: startDate },
    },
    select: { createdAt: true },
  });

  const orderMap = new Map<string, number>();
  for (const o of orders) {
    const dateStr = formatYYYYMMDD(o.createdAt);
    orderMap.set(dateStr, (orderMap.get(dateStr) || 0) + 1);
  }

  const dateRange = generateDateRange(startDate);
  return dateRange.map((date) => ({
    date,
    orders: orderMap.get(date) || 0,
  }));
}

// ---------------------------------------------------------------------------
// Service: Popular Menu Items
// ---------------------------------------------------------------------------

export async function getPopularItems(restaurantId: string, limit: number) {
  // Aggregate using Prisma groupBy on OrderItem
  const topItems = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      restaurantId,
      order: { status: { not: "CANCELLED" } },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  // Fetch names
  const menuItemIds = topItems.map((t) => t.menuItemId);
  const items = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    select: { id: true, name: true },
  });

  const nameMap = new Map(items.map((i) => [i.id, i.name]));

  return topItems.map((t) => ({
    menuItemId: t.menuItemId,
    name: nameMap.get(t.menuItemId) || "Unknown",
    totalSold: t._sum.quantity || 0,
  }));
}

// ---------------------------------------------------------------------------
// Service: Ingredient Usage Burn Rate
// ---------------------------------------------------------------------------

export async function getIngredientUsageData(restaurantId: string, days: number) {
  const startDate = getDateXDaysAgo(days);

  const deductions = await prisma.stockHistory.findMany({
    where: {
      restaurantId,
      reason: StockChangeReason.ORDER_DEDUCTION,
      createdAt: { gte: startDate },
    },
    select: { ingredientId: true, changeAmount: true },
  });

  const usageMap = new Map<string, number>();
  for (const d of deductions) {
    // changeAmount is negative for deductions, we want absolute sum
    const absChange = Math.abs(d.changeAmount);
    usageMap.set(d.ingredientId, (usageMap.get(d.ingredientId) || 0) + absChange);
  }

  if (usageMap.size === 0) return [];

  // Fetch names and units
  const ingredientIds = Array.from(usageMap.keys());
  const ingredients = await prisma.ingredient.findMany({
    where: { id: { in: ingredientIds } },
    select: { id: true, name: true, unit: true },
  });

  const ingMap = new Map(ingredients.map((i) => [i.id, i]));

  // Sort by highest usage first, take top 10
  const result = Array.from(usageMap.entries())
    .map(([id, usage]) => {
      const ing = ingMap.get(id);
      return {
        ingredientId: id,
        name: ing?.name || "Unknown",
        unit: ing?.unit || "",
        totalUsed: Number(usage.toFixed(2)),
      };
    })
    .sort((a, b) => b.totalUsed - a.totalUsed)
    .slice(0, 10);

  return result;
}
