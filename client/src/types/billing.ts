// ---------------------------------------------------------------------------
// Payment method
// ---------------------------------------------------------------------------

export type PaymentMethod = "CASH" | "UPI" | "CARD";

// ---------------------------------------------------------------------------
// A pending bill — a READY order that has not yet been paid
// ---------------------------------------------------------------------------

export interface PendingBill {
  orderId: string;
  orderNumber: string;
  customerName: string;
  tableNumber: number;
  itemCount: number;
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// A single line item shown inside a bill preview / completed bill
// ---------------------------------------------------------------------------

export interface BillLineItem {
  menuItemId: string;
  name: string;
  quantity: number;
  priceAtOrder: number;
  lineTotal: number;
}

// ---------------------------------------------------------------------------
// Full itemised bill preview returned by GET /api/billing/:orderId
// ---------------------------------------------------------------------------

export interface BillPreview {
  orderId: string;
  orderNumber: string;
  customerName: string;
  tableNumber: number;
  specialInstructions?: string | null;
  items: BillLineItem[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// A completed (paid) bill returned by GET /api/billing/completed
// ---------------------------------------------------------------------------

export interface CompletedBill {
  paymentId: string;
  receiptNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  tableNumber: number;
  method: PaymentMethod;
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
  status: string;
  paidAt: string;
  items: BillLineItem[];
}

// ---------------------------------------------------------------------------
// Payment confirmation returned by POST /api/billing/:orderId/pay
// ---------------------------------------------------------------------------

export interface PaymentConfirmation {
  id: string;
  receiptNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  tableNumber: number;
  method: PaymentMethod;
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
  status: string;
  paidAt: string;
}
