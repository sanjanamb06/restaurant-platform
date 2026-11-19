import api from "./axiosInstance";
import { ApiResponse } from "../types";
import { Order, OrderStatus } from "../types/order";

export async function getOrders(params?: {
  status?: OrderStatus;
  search?: string;
}): Promise<Order[]> {
  const response = await api.get<ApiResponse<{ orders: Order[] }>>("/orders", {
    params,
  });
  return response.data.data.orders;
}

export async function getOrder(orderId: string): Promise<Order> {
  const response = await api.get<ApiResponse<{ order: Order }>>(`/orders/${orderId}`);
  return response.data.data.order;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<Order> {
  const response = await api.patch<ApiResponse<{ order: Order }>>(
    `/orders/${orderId}/status`,
    { status },
  );
  return response.data.data.order;
}
