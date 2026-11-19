import { OrderStatus, Prisma } from "@prisma/client";
import crypto from "node:crypto";
import { prisma } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { getIO } from "../socket";
import {
  CheckTableInput,
  CreatePublicOrderInput,
  JoinPublicOrderInput,
} from "../validators/public.validator";
import { assertPublicOrderRateLimit } from "./publicRateLimit.service";

const CLOSED_ORDER_STATUSES: OrderStatus[] = [OrderStatus.CANCELLED];

type TransactionClient = Prisma.TransactionClient;

const orderInclude = {
  table: {
    select: {
      tableNumber: true,
    },
  },
  guestSession: {
    select: {
      sessionToken: true,
    },
  },
  items: {
    include: {
      menuItem: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { menuItem: { name: "asc" } },
  },
} satisfies Prisma.OrderInclude;

function parseTableNumber(tableNumber: string): number {
  return Number(tableNumber);
}

function serializeMenuItem(item: {
  id: string;
  name: string;
  description: string | null;
  price: Prisma.Decimal;
  imageUrl: string | null;
}) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    imageUrl: item.imageUrl,
  };
}

function serializeOrder(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customerName,
    tableNumber: parseTableNumber(order.table.tableNumber),
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

type SerializedOrder = ReturnType<typeof serializeOrder>;

interface CreatePublicOrderResponse {
  order: SerializedOrder;
  sessionToken: string;
}

interface JoinPublicOrderResponse {
  order: SerializedOrder;
}

function aggregateItems(items: Array<{ menuItemId: string; quantity: number }>) {
  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(item.menuItemId, (quantities.get(item.menuItemId) ?? 0) + item.quantity);
  }

  return quantities;
}

function isUniqueConstraintError(error: unknown, field: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes(field)
  );
}

async function getIdempotentResponse<T>(
  client: typeof prisma | TransactionClient,
  idempotencyKey?: string,
): Promise<T | null> {
  if (!idempotencyKey) return null;

  const record = await client.idempotencyRecord.findUnique({
    where: { key: idempotencyKey },
    select: { responseSnapshot: true },
  });

  return record ? (record.responseSnapshot as T) : null;
}

async function storeIdempotentResponse(
  tx: TransactionClient,
  idempotencyKey: string | undefined,
  response: unknown,
) {
  if (!idempotencyKey) return;

  await tx.idempotencyRecord.create({
    data: {
      key: idempotencyKey,
      responseSnapshot: response as Prisma.InputJsonValue,
    },
  });
}

async function getStoredIdempotentResponseAfterConflict<T>(idempotencyKey?: string) {
  if (!idempotencyKey) return null;
  return getIdempotentResponse<T>(prisma, idempotencyKey);
}

async function ensureRestaurantExists(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, name: true },
  });

  if (!restaurant) {
    throw new AppError(404, "Restaurant not found");
  }

  return restaurant;
}

async function findOrCreateTable(
  client: typeof prisma | TransactionClient,
  restaurantId: string,
  tableNumber: number,
) {
  return client.table.upsert({
    where: {
      restaurantId_tableNumber: {
        restaurantId,
        tableNumber: String(tableNumber),
      },
    },
    update: {},
    create: {
      restaurantId,
      tableNumber: String(tableNumber),
    },
    select: {
      id: true,
      tableNumber: true,
    },
  });
}

async function validateMenuItems(
  client: typeof prisma | TransactionClient,
  restaurantId: string,
  quantities: Map<string, number>,
) {
  const menuItems = await client.menuItem.findMany({
    where: {
      id: { in: [...quantities.keys()] },
      restaurantId,
      deletedAt: null,
      isAvailable: true,
    },
    select: {
      id: true,
      price: true,
    },
  });

  if (menuItems.length !== quantities.size) {
    throw new AppError(400, "One or more menu items are unavailable");
  }

  return menuItems;
}

async function getNextOrderNumber(tx: TransactionClient, restaurantId: string) {
  const orders = await tx.order.findMany({
    where: { restaurantId },
    select: { orderNumber: true },
  });

  const highestNumber = orders.reduce((highest, order) => {
    const match = /^ORD-(\d+)$/.exec(order.orderNumber);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `ORD-${String(highestNumber + 1).padStart(4, "0")}`;
}

async function createOrReuseGuestSession(
  tx: TransactionClient,
  restaurantId: string,
  tableId: string,
  customerName: string,
) {
  const existingSession = await tx.guestSession.findFirst({
    where: {
      restaurantId,
      tableId,
      customerName,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (existingSession) {
    return tx.guestSession.update({
      where: { id: existingSession.id },
      data: { lastOrderAt: new Date() },
      select: { id: true, sessionToken: true },
    });
  }

  return tx.guestSession.create({
    data: {
      restaurantId,
      tableId,
      customerName,
      sessionToken: crypto.randomUUID(),
      lastOrderAt: new Date(),
    },
    select: { id: true, sessionToken: true },
  });
}

export async function getPublicMenu(restaurantId: string) {
  const restaurant = await ensureRestaurantExists(restaurantId);
  const categories = await prisma.category.findMany({
    where: { restaurantId, deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      menuItems: {
        where: {
          restaurantId,
          deletedAt: null,
          isAvailable: true,
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
        },
      },
    },
  });

  return {
    restaurant,
    categories: categories
      .filter((category) => category.menuItems.length > 0)
      .map((category) => ({
        id: category.id,
        name: category.name,
        items: category.menuItems.map(serializeMenuItem),
      })),
  };
}

export async function listPublicTables(restaurantId: string) {
  await ensureRestaurantExists(restaurantId);
  const tables = await prisma.table.findMany({
    where: { restaurantId },
    select: { tableNumber: true },
    orderBy: { tableNumber: "asc" },
  });

  return {
    tableNumbers: tables
      .map((table) => parseTableNumber(table.tableNumber))
      .filter((tableNumber) => Number.isInteger(tableNumber))
      .sort((left, right) => left - right),
  };
}

export async function checkPublicTable(restaurantId: string, input: CheckTableInput) {
  await ensureRestaurantExists(restaurantId);
  const table = await findOrCreateTable(prisma, restaurantId, input.tableNumber);
  const activeOrder = await prisma.order.findFirst({
    where: {
      restaurantId,
      tableId: table.id,
      status: { notIn: CLOSED_ORDER_STATUSES },
    },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

  if (!activeOrder) {
    return { hasActiveOrder: false };
  }

  return {
    hasActiveOrder: true,
    order: serializeOrder(activeOrder),
  };
}

export async function createPublicOrder(restaurantId: string, input: CreatePublicOrderInput) {
  await ensureRestaurantExists(restaurantId);

  const storedResponse = await getIdempotentResponse<CreatePublicOrderResponse>(prisma, input.idempotencyKey);
  if (storedResponse) return storedResponse;

  const table = await findOrCreateTable(prisma, restaurantId, input.tableNumber);
  assertPublicOrderRateLimit(`table:${table.id}`, input.idempotencyKey);

  const quantities = aggregateItems(input.items);
  const menuItems = await validateMenuItems(prisma, restaurantId, quantities);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingResponse = await getIdempotentResponse<CreatePublicOrderResponse>(tx, input.idempotencyKey);
      if (existingResponse) return existingResponse;

      const guestSession = await createOrReuseGuestSession(
        tx,
        restaurantId,
        table.id,
        input.customerName,
      );

      // Calculate totalAmount from item prices × quantities
      const totalAmount = menuItems.reduce((sum, menuItem) => {
        return sum + Number(menuItem.price) * (quantities.get(menuItem.id) ?? 0);
      }, 0);

      const order = await tx.order.create({
        data: {
          restaurantId,
          tableId: table.id,
          guestSessionId: guestSession.id,
          orderNumber: await getNextOrderNumber(tx, restaurantId),
          customerName: input.customerName,
          specialInstructions: input.specialInstructions,
          status: OrderStatus.PENDING,
          totalAmount,
          items: {
            create: menuItems.map((menuItem) => ({
              restaurantId,
              menuItemId: menuItem.id,
              quantity: quantities.get(menuItem.id)!,
              priceAtOrder: Number(menuItem.price),
            })),
          },
        },
        include: orderInclude,
      });

      const response = {
        order: serializeOrder(order),
        sessionToken: guestSession.sessionToken,
      };

      await storeIdempotentResponse(tx, input.idempotencyKey, response);
      return response;
    });

    // Emit Socket.IO event so the kitchen/dashboard can react in real time
    try {
      getIO()
        .to(`restaurant:${restaurantId}`)
        .emit("order:new", { order: result.order });
    } catch {
      // Socket.IO may not be initialised in test environments — safe to swallow
    }

    return result;
  } catch (error) {
    if (isUniqueConstraintError(error, "key")) {
      const storedConflictResponse = await getStoredIdempotentResponseAfterConflict(
        input.idempotencyKey,
      );
      if (storedConflictResponse) return storedConflictResponse;
    }
    throw error;
  }
}

export async function joinPublicOrder(
  restaurantId: string,
  orderId: string,
  input: JoinPublicOrderInput,
) {
  await ensureRestaurantExists(restaurantId);

  const storedResponse = await getIdempotentResponse<JoinPublicOrderResponse>(prisma, input.idempotencyKey);
  if (storedResponse) return storedResponse;

  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: {
      table: { select: { id: true } },
      guestSession: { select: { sessionToken: true } },
    },
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (CLOSED_ORDER_STATUSES.includes(order.status)) {
    throw new AppError(409, "This order has already been completed — please start a new one.");
  }

  const rateLimitKey = order.guestSession?.sessionToken
    ? `session:${order.guestSession.sessionToken}`
    : `table:${order.table.id}`;
  assertPublicOrderRateLimit(rateLimitKey, input.idempotencyKey);

  const quantities = aggregateItems(input.items);
  const menuItems = await validateMenuItems(prisma, restaurantId, quantities);

  try {
    return await prisma.$transaction(async (tx) => {
      const existingResponse = await getIdempotentResponse<JoinPublicOrderResponse>(tx, input.idempotencyKey);
      if (existingResponse) return existingResponse;

      const activeOrder = await tx.order.findFirst({
        where: { id: orderId, restaurantId },
        select: { id: true, status: true },
      });

      if (!activeOrder) {
        throw new AppError(404, "Order not found");
      }

      if (CLOSED_ORDER_STATUSES.includes(activeOrder.status)) {
        throw new AppError(
          409,
          "This order has already been completed — please start a new one.",
        );
      }

      await Promise.all(
        menuItems.map((menuItem) =>
          tx.orderItem.upsert({
            where: {
              orderId_menuItemId: {
                orderId,
                menuItemId: menuItem.id,
              },
            },
            update: {
              quantity: { increment: quantities.get(menuItem.id)! },
            },
            create: {
              restaurantId,
              orderId,
              menuItemId: menuItem.id,
              quantity: quantities.get(menuItem.id)!,
              priceAtOrder: Number(menuItem.price),
            },
          }),
        ),
      );

      const updatedOrder = await tx.order.findFirstOrThrow({
        where: { id: orderId, restaurantId },
        include: orderInclude,
      });

      const response = { order: serializeOrder(updatedOrder) };
      await storeIdempotentResponse(tx, input.idempotencyKey, response);
      return response;
    });
  } catch (error) {
    if (isUniqueConstraintError(error, "key")) {
      const storedConflictResponse = await getStoredIdempotentResponseAfterConflict(
        input.idempotencyKey,
      );
      if (storedConflictResponse) return storedConflictResponse;
    }
    throw error;
  }
}

export async function getPublicOrder(restaurantId: string, orderId: string) {
  await ensureRestaurantExists(restaurantId);
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: orderInclude,
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  return { order: serializeOrder(order) };
}
