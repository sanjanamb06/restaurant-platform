import { z } from "zod";

export const publicRestaurantParamSchema = z.object({
  restaurantId: z.string().min(1, "Restaurant ID is required"),
});

export const publicOrderParamSchema = publicRestaurantParamSchema.extend({
  orderId: z.string().min(1, "Order ID is required"),
});

const orderItemSchema = z.object({
  menuItemId: z.string().min(1, "Menu item ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export const checkTableSchema = z.object({
  tableNumber: z.number().int().positive("Table number must be a positive integer"),
});

export const createPublicOrderSchema = checkTableSchema.extend({
  customerName: z.string().trim().min(2).max(50),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  specialInstructions: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().trim().min(1).max(200).optional(),
});

export const joinPublicOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  idempotencyKey: z.string().trim().min(1).max(200).optional(),
});

export type CheckTableInput = z.infer<typeof checkTableSchema>;
export type CreatePublicOrderInput = z.infer<typeof createPublicOrderSchema>;
export type JoinPublicOrderInput = z.infer<typeof joinPublicOrderSchema>;
