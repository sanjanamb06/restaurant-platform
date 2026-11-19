import axios from "axios";
import { ApiResponse } from "../../types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const publicApi = axios.create({
  baseURL: `${apiBaseUrl}/public`,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

export interface PublicMenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable?: boolean;
}

export interface PublicMenuCategory {
  id: string;
  name: string;
  items: PublicMenuItem[];
}

export interface PublicMenu {
  restaurantName: string;
  categories: PublicMenuCategory[];
}

export interface PublicOrderItem {
  id?: string;
  menuItemId: string;
  name: string;
  quantity: number;
  priceAtOrder: number;
}

export interface PublicOrder {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  tableNumber: number;
  items: PublicOrderItem[];
}

interface RawPublicMenu {
  restaurantName?: string;
  restaurant?: { name: string };
  categories: PublicMenuCategory[];
}

interface RawTables {
  tables?: Array<{ tableNumber: number }>;
  tableNumbers?: number[];
}

export async function getPublicMenu(restaurantId: string): Promise<PublicMenu> {
  const response = await publicApi.get<ApiResponse<RawPublicMenu>>(`/${restaurantId}/menu`);
  return {
    restaurantName: response.data.data.restaurantName ?? response.data.data.restaurant?.name ?? "Menu",
    categories: response.data.data.categories,
  };
}

export async function getPublicTables(restaurantId: string): Promise<number[]> {
  const response = await publicApi.get<ApiResponse<RawTables>>(`/${restaurantId}/tables`);
  if (response.data.data.tables) {
    return response.data.data.tables.map((table) => table.tableNumber);
  }
  return response.data.data.tableNumbers ?? [];
}

export async function checkTable(
  restaurantId: string,
  tableNumber: number,
): Promise<{ hasActiveOrder: boolean; order?: PublicOrder }> {
  const response = await publicApi.post<ApiResponse<{ hasActiveOrder: boolean; order?: PublicOrder }>>(
    `/${restaurantId}/check-table`,
    { tableNumber },
  );
  return response.data.data;
}

export async function createPublicOrder(
  restaurantId: string,
  input: {
    tableNumber: number;
    customerName: string;
    items: Array<{ menuItemId: string; quantity: number }>;
    specialInstructions?: string;
    idempotencyKey?: string;
  },
): Promise<{ order: PublicOrder; sessionToken: string }> {
  const response = await publicApi.post<ApiResponse<{ order: PublicOrder; sessionToken: string }>>(
    `/${restaurantId}/orders`,
    input,
  );
  return response.data.data;
}

export async function joinPublicOrder(
  restaurantId: string,
  orderId: string,
  input: {
    items: Array<{ menuItemId: string; quantity: number }>;
    idempotencyKey?: string;
  },
): Promise<{ order: PublicOrder }> {
  const response = await publicApi.post<ApiResponse<{ order: PublicOrder }>>(
    `/${restaurantId}/orders/${orderId}/join`,
    input,
  );
  return response.data.data;
}

export async function getPublicOrder(
  restaurantId: string,
  orderId: string,
): Promise<{ order: PublicOrder }> {
  const response = await publicApi.get<ApiResponse<{ order: PublicOrder }>>(
    `/${restaurantId}/orders/${orderId}`,
  );
  return response.data.data;
}

export function getPublicApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    if (error.response?.status === 429) {
      return "Hang tight, your last order is still processing.";
    }
    return error.response?.data?.error ?? fallback;
  }
  return fallback;
}
