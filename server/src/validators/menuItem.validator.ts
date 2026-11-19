import { z } from "zod";

const priceSchema = z
  .number({ invalid_type_error: "Price must be a number" })
  .positive("Price must be a positive number")
  .refine((value) => Math.round(value * 100) / 100 === value, {
    message: "Price must have at most 2 decimal places",
  });

export const menuItemIdParamSchema = z.object({
  id: z.string().min(1, "Menu item ID is required"),
});

export const listMenuItemsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  available: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});

export type ListMenuItemsQuery = z.infer<typeof listMenuItemsQuerySchema>;

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().optional(),
  price: priceSchema,
  categoryId: z.string().min(1, "Category ID is required"),
  imageUrl: z.string().trim().url().optional().nullable(),
  isAvailable: z.boolean().optional(),
});

export const updateMenuItemSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().optional(),
    price: priceSchema.optional(),
    categoryId: z.string().min(1).optional(),
    imageUrl: z.string().trim().url().optional().nullable(),
    isAvailable: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
