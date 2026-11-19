import { z } from "zod";

export const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(30),
});

export const popularItemsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(5),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type PopularItemsQuery = z.infer<typeof popularItemsQuerySchema>;
