export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "CANCELLED";

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  priceAtOrder: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  tableNumber: number;
  specialInstructions?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderStatusUpdatedEvent {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  updatedAt: string;
}
