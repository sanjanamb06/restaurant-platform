import { OrderStatus } from "@prisma/client";
import { z } from "zod";

export const orderStatusSchema = z.nativeEnum(OrderStatus);

export const patchOrderStatusSchema = z.object({
  status: orderStatusSchema,
});

export const orderIdParamSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
});

export type PatchOrderStatusInput = z.infer<typeof patchOrderStatusSchema>;
