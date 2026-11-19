import { Prisma } from "@prisma/client";
import { prisma } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { getIO } from "../socket";
import { deductStockForOrder } from "./inventory.service";
import type { PaymentMethod } from "../validators/billing.validator";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Flat restaurant-level GST rate for standalone restaurants & cafes.
 * Standalone Restaurants: 5% GST (ITC cannot be claimed).
 * Change this constant if the restaurant type changes.
 */
const GST_RATE = 0.05;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Generate a human-readable, unique receipt number. */
function generateReceiptNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `RCP-${ts}-${rand}`;
}

/**
 * Reusable include for fetching an order with items + menu item names.
 * Mirrors the shape used by order.service.ts so consumers get consistent data.
 */
const orderWithItemsInclude = {
  items: {
    include: {
      menuItem: { select: { id: true, name: true } },
    },
    orderBy: { menuItem: { name: "asc" as const } },
  },
  table: { select: { id: true, tableNumber: true } },
  payment: true,
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{
  include: typeof orderWithItemsInclude;
}>;

/**
 * Compute billing figures from an Order row.
 * Falls back to recomputing subtotal from line items if `order.totalAmount` is null.
 */
function computeBillAmounts(order: OrderWithItems) {
  const subtotal =
    order.totalAmount != null
      ? Number(order.totalAmount)
      : order.items.reduce(
          (sum, item) => sum + item.priceAtOrder * item.quantity,
          0,
        );

  const gstAmount = parseFloat((subtotal * GST_RATE).toFixed(2));
  const grandTotal = parseFloat((subtotal + gstAmount).toFixed(2));

  return { subtotal: parseFloat(subtotal.toFixed(2)), gstAmount, grandTotal };
}

// ---------------------------------------------------------------------------
// Service: getPendingBills
// ---------------------------------------------------------------------------

/**
 * Returns all READY orders in the restaurant that do NOT yet have a Payment row.
 * These are the bills the cashier needs to settle.
 */
export async function getPendingBills(restaurantId: string) {
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: "READY",
      payment: { is: null }, // no payment record exists
    },
    include: orderWithItemsInclude,
    orderBy: { createdAt: "asc" }, // oldest first — serve in FIFO order
  });

  return orders.map((order) => {
    const { subtotal, gstAmount, grandTotal } = computeBillAmounts(order);
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      tableNumber: Number(order.table.tableNumber),
      itemCount: order.items.length,
      subtotal,
      gstRate: GST_RATE,
      gstAmount,
      grandTotal,
      createdAt: order.createdAt.toISOString(),
    };
  });
}

// ---------------------------------------------------------------------------
// Service: getCompletedBills
// ---------------------------------------------------------------------------

/**
 * Returns all paid bills for the restaurant, newest first.
 */
export async function getCompletedBills(restaurantId: string) {
  const payments = await prisma.payment.findMany({
    where: { restaurantId, status: "PAID" },
    include: {
      order: {
        include: orderWithItemsInclude,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return payments.map((payment) => ({
    paymentId: payment.id,
    receiptNumber: payment.receiptNumber,
    orderId: payment.orderId,
    orderNumber: payment.order.orderNumber,
    customerName: payment.order.customerName,
    tableNumber: Number(payment.order.table.tableNumber),
    method: payment.method,
    subtotal: Number(payment.amount),
    gstRate: GST_RATE,
    gstAmount: Number(payment.gstAmount),
    grandTotal: parseFloat(
      (Number(payment.amount) + Number(payment.gstAmount)).toFixed(2),
    ),
    status: payment.status,
    paidAt: payment.createdAt.toISOString(),
    items: payment.order.items.map((item) => ({
      name: item.menuItem.name,
      quantity: item.quantity,
      priceAtOrder: item.priceAtOrder,
      lineTotal: parseFloat((item.priceAtOrder * item.quantity).toFixed(2)),
    })),
  }));
}

// ---------------------------------------------------------------------------
// Service: getBillPreview
// ---------------------------------------------------------------------------

/**
 * Returns the full itemised bill preview for a single READY order.
 * Throws 404 if order is not found, 400 if it is not yet READY,
 * and 409 if a payment already exists.
 */
export async function getBillPreview(restaurantId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: orderWithItemsInclude,
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (order.status !== "READY") {
    throw new AppError(
      400,
      `Order is not ready for billing (current status: ${order.status})`,
    );
  }

  if (order.payment) {
    throw new AppError(
      409,
      `This order has already been billed (receipt: ${order.payment.receiptNumber})`,
    );
  }

  const { subtotal, gstAmount, grandTotal } = computeBillAmounts(order);

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    tableNumber: Number(order.table.tableNumber),
    specialInstructions: order.specialInstructions,
    items: order.items.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.menuItem.name,
      quantity: item.quantity,
      priceAtOrder: item.priceAtOrder,
      lineTotal: parseFloat((item.priceAtOrder * item.quantity).toFixed(2)),
    })),
    subtotal,
    gstRate: GST_RATE,
    gstAmount,
    grandTotal,
    createdAt: order.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Service: processPayment
// ---------------------------------------------------------------------------

/**
 * Records a payment for the given order atomically.
 *
 * Guards:
 *  - Order must exist and belong to the restaurant.
 *  - Order must have status READY.
 *  - No existing Payment row must exist (idempotency).
 */
export async function processPayment(
  restaurantId: string,
  orderId: string,
  method: PaymentMethod,
) {
  // Fetch order with payment relation to validate state
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: orderWithItemsInclude,
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (order.status !== "READY") {
    throw new AppError(
      400,
      `Cannot process payment — order is ${order.status}, not READY`,
    );
  }

  if (order.payment) {
    throw new AppError(
      409,
      `Payment already recorded (receipt: ${order.payment.receiptNumber})`,
    );
  }

  const { subtotal, gstAmount } = computeBillAmounts(order);
  const grandTotal = parseFloat((subtotal + gstAmount).toFixed(2));
  const receiptNumber = generateReceiptNumber();

  // Create the Payment record and deduct stock in one atomic transaction
  let lowStockAlerts: Awaited<ReturnType<typeof deductStockForOrder>> = [];

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        restaurantId,
        orderId,
        amount: new Prisma.Decimal(subtotal),
        gstAmount: new Prisma.Decimal(gstAmount),
        method,
        status: "PAID",
        receiptNumber,
      },
    });

    // Deduct ingredient stock based on recipe mappings — silently skips
    // items with no recipe. Stock is clamped to 0 (never goes negative).
    lowStockAlerts = await deductStockForOrder(tx, restaurantId, orderId);

    return created;
  });

  // After the transaction commits, emit low-stock alerts via Socket.IO.
  // This is done outside the transaction so a failed Socket.IO emit never
  // rolls back a successfully processed payment.
  if (lowStockAlerts.length > 0) {
    try {
      getIO()
        .to(`restaurant:${restaurantId}`)
        .emit("inventory:lowStock", { alerts: lowStockAlerts });
    } catch {
      console.warn("Socket.IO not initialised — skipping inventory:lowStock emit");
    }
  }

  return {
    id: payment.id,
    receiptNumber: payment.receiptNumber,
    orderId: payment.orderId,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    tableNumber: Number(order.table.tableNumber),
    method: payment.method,
    subtotal,
    gstRate: GST_RATE,
    gstAmount: Number(payment.gstAmount),
    grandTotal,
    status: payment.status,
    paidAt: payment.createdAt.toISOString(),
  };
}
