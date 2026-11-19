import { z } from "zod";

export const categoryIdParamSchema = z.object({
  id: z.string().min(1, "Category ID is required"),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().optional(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
