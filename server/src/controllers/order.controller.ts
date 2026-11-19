import { NextFunction, Request, Response } from "express";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";
import * as orderService from "../services/order.service";
import { orderIdParamSchema, patchOrderStatusSchema } from "../validators/order.validator";
import { sendSuccess } from "../utils/apiResponse";

// ---------------------------------------------------------------------------
// GET /api/orders
// ---------------------------------------------------------------------------

const listOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  search: z.string().trim().optional(),
});

export async function listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, search } = listOrdersQuerySchema.parse(req.query);
    const orders = await orderService.listOrders(req.user!.restaurantId, req.user!.role, {
      status,
      search,
    });
    sendSuccess(res, 200, { orders });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/orders/:id
// ---------------------------------------------------------------------------

export async function getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = orderIdParamSchema.parse(req.params);
    const order = await orderService.getOrder(
      req.user!.restaurantId,
      id,
      req.user!.role,
    );
    sendSuccess(res, 200, { order });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/orders/:id/status
// ---------------------------------------------------------------------------

export async function updateOrderStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = orderIdParamSchema.parse(req.params);
    const { status } = patchOrderStatusSchema.parse(req.body);
    const updated = await orderService.updateOrderStatus(
      req.user!.restaurantId,
      id,
      req.user!.role,
      status,
    );
    sendSuccess(res, 200, { order: updated }, "Order status updated");
  } catch (error) {
    next(error);
  }
}
