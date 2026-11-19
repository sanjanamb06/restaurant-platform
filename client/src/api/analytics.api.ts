import api from "./axiosInstance";
import { ApiResponse } from "../types";
import type {
  IngredientUsage,
  OrderVolumeData,
  PopularItem,
  RevenueData,
} from "../types/analytics";

export async function getRevenueData(days: number): Promise<RevenueData[]> {
  const response = await api.get<ApiResponse<{ data: RevenueData[] }>>(
    "/analytics/revenue",
    { params: { days } },
  );
  return response.data.data.data; // response structure: { success: true, data: { data: [...] } }
}

export async function getOrderVolumeData(
  days: number,
): Promise<OrderVolumeData[]> {
  const response = await api.get<ApiResponse<{ data: OrderVolumeData[] }>>(
    "/analytics/orders",
    { params: { days } },
  );
  return response.data.data.data;
}

export async function getPopularItems(limit: number): Promise<PopularItem[]> {
  const response = await api.get<ApiResponse<{ data: PopularItem[] }>>(
    "/analytics/popular-items",
    { params: { limit } },
  );
  return response.data.data.data;
}

export async function getIngredientUsageData(
  days: number,
): Promise<IngredientUsage[]> {
  const response = await api.get<ApiResponse<{ data: IngredientUsage[] }>>(
    "/analytics/ingredient-usage",
    { params: { days } },
  );
  return response.data.data.data;
}
