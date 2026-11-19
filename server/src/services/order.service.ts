import { OrderStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { getIO } from "../socket";

// ---------------------------------------------------------------------------
// Shared include for order queries
// ---------------------------------------------------------------------------

const orderInclude = {
  items: {
    include: {
      menuItem: {
        select: { id: true, name: true },
      },
    },
    orderBy: { menuItem: { name: "asc" as const } },
  },
  table: {
    select: { id: true, tableNumber: true },
  },
} satisfies Prisma.OrderInclude;

function serializeOrder(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customerName,
    tableNumber: Number(order.table.tableNumber),
    specialInstructions: order.specialInstructions,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.menuItem.name,
      quantity: item.quantity,
      priceAtOrder: item.priceAtOrder,
    })),
  };
}

// ---------------------------------------------------------------------------
// Transition rules
// ---------------------------------------------------------------------------

type Transition = { from: OrderStatus; to: OrderStatus };

const ALLOWED_TRANSITIONS: Transition[] = [
  { from: OrderStatus.PENDING, to: OrderStatus.PREPARING },
  { from: OrderStatus.PREPARING, to: OrderStatus.READY },
  { from: OrderStatus.PENDING, to: OrderStatus.CANCELLED },
];

/** Roles permitted to make each transition */
const TRANSITION_ROLES: Record<string, Role[]> = {
  [`${OrderStatus.PENDING}→${OrderStatus.PREPARING}`]: [Role.CHEF, Role.ADMIN],
  [`${OrderStatus.PREPARING}→${OrderStatus.READY}`]: [Role.CHEF, Role.ADMIN],
  [`${OrderStatus.PENDING}→${OrderStatus.CANCELLED}`]: [Role.MANAGER, Role.ADMIN],
};

function transitionKey(from: OrderStatus, to: OrderStatus): string {
  return `${from}→${to}`;
}

// ---------------------------------------------------------------------------
// GET /api/orders
// ---------------------------------------------------------------------------

export async function listOrders(
  restaurantId: string,
  role: Role,
  filters: { status?: OrderStatus; search?: string },
) {
  const { status, search } = filters;

  // CHEF never sees CANCELLED orders
  const statusFilter =
    role === Role.CHEF
      ? status
        ? status === OrderStatus.CANCELLED
          ? { in: [] as OrderStatus[] } // no results if explicitly asking for CANCELLED as CHEF
          : { equals: status }
        : { not: OrderStatus.CANCELLED }
      : status
        ? { equals: status }
        : undefined;

  const where = {
    restaurantId,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" as const } },
            { customerName: { contains: search, mode: "insensitive" as const } },
            // tableNumber is stored as a string; try to match it
            { table: { tableNumber: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

  return orders.map(serializeOrder);
}

// ---------------------------------------------------------------------------
// GET /api/orders/:id
// ---------------------------------------------------------------------------

export async function getOrder(restaurantId: string, orderId: string, role: Role) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: orderInclude,
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  // CHEF cannot see CANCELLED orders
  if (role === Role.CHEF && order.status === OrderStatus.CANCELLED) {
    throw new AppError(404, "Order not found");
  }

  return serializeOrder(order);
}

// ---------------------------------------------------------------------------
// PATCH /api/orders/:id/status
// ---------------------------------------------------------------------------

export async function updateOrderStatus(
  restaurantId: string,
  orderId: string,
  role: Role,
  newStatus: OrderStatus,
) {
  // Fetch order scoped to restaurant
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    select: { id: true, orderNumber: true, status: true, restaurantId: true },
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  const key = transitionKey(order.status, newStatus);

  // Check whether this transition is structurally valid at all
  const isAllowedTransition = ALLOWED_TRANSITIONS.some(
    (t) => t.from === order.status && t.to === newStatus,
  );
  if (!isAllowedTransition) {
    throw new AppError(400, "This status transition isn't allowed.");
  }

  // Check whether the caller's role is permitted for this specific transition
  const allowedRoles = TRANSITION_ROLES[key] ?? [];
  if (!allowedRoles.includes(role)) {
    throw new AppError(403, "You don't have permission to make this status change.");
  }

  // Apply the update
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
    include: orderInclude,
  });

  const serialized = serializeOrder(updated);

  // Emit Socket.IO event to the restaurant's room
  try {
    getIO()
      .to(`restaurant:${restaurantId}`)
      .emit("order:statusUpdated", {
        orderId: serialized.id,
        orderNumber: serialized.orderNumber,
        status: serialized.status,
        updatedAt: updated.updatedAt.toISOString(),
      });
  } catch {
    // Socket.IO not yet initialised (shouldn't happen in production, but guard anyway)
    console.warn("Socket.IO not initialised — skipping order:statusUpdated emit");
  }

  return serialized;
}

