import api from "./axiosInstance";
import { ApiResponse } from "../types";
import type {
  BillPreview,
  CompletedBill,
  PaymentConfirmation,
  PaymentMethod,
  PendingBill,
} from "../types/billing";

// ---------------------------------------------------------------------------
// GET /api/billing/pending
// ---------------------------------------------------------------------------

export async function getPendingBills(): Promise<PendingBill[]> {
  const response = await api.get<ApiResponse<{ bills: PendingBill[] }>>(
    "/billing/pending",
  );
  return response.data.data.bills;
}

// ---------------------------------------------------------------------------
// GET /api/billing/completed
// ---------------------------------------------------------------------------

export async function getCompletedBills(): Promise<CompletedBill[]> {
  const response = await api.get<ApiResponse<{ bills: CompletedBill[] }>>(
    "/billing/completed",
  );
  return response.data.data.bills;
}

// ---------------------------------------------------------------------------
// GET /api/billing/:orderId — itemised bill preview
// ---------------------------------------------------------------------------

export async function getBillPreview(orderId: string): Promise<BillPreview> {
  const response = await api.get<ApiResponse<{ bill: BillPreview }>>(
    `/billing/${orderId}`,
  );
  return response.data.data.bill;
}

// ---------------------------------------------------------------------------
// POST /api/billing/:orderId/pay
// ---------------------------------------------------------------------------

export async function processPayment(
  orderId: string,
  method: PaymentMethod,
): Promise<PaymentConfirmation> {
  const response = await api.post<ApiResponse<{ payment: PaymentConfirmation }>>(
    `/billing/${orderId}/pay`,
    { method },
  );
  return response.data.data.payment;
}
