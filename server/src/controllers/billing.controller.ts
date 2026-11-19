import { NextFunction, Request, Response } from "express";
import * as billingService from "../services/billing.service";
import {
  billingOrderParamSchema,
  payBillSchema,
} from "../validators/billing.validator";
import { sendSuccess } from "../utils/apiResponse";

// ---------------------------------------------------------------------------
// GET /api/billing/pending
// ---------------------------------------------------------------------------

export async function getPendingBills(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const bills = await billingService.getPendingBills(req.user!.restaurantId);
    sendSuccess(res, 200, { bills });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/billing/completed
// ---------------------------------------------------------------------------

export async function getCompletedBills(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const bills = await billingService.getCompletedBills(
      req.user!.restaurantId,
    );
    sendSuccess(res, 200, { bills });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/billing/:orderId
// ---------------------------------------------------------------------------

export async function getBillPreview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { orderId } = billingOrderParamSchema.parse(req.params);
    const bill = await billingService.getBillPreview(
      req.user!.restaurantId,
      orderId,
    );
    sendSuccess(res, 200, { bill });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/billing/:orderId/pay
// ---------------------------------------------------------------------------

export async function processPayment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { orderId } = billingOrderParamSchema.parse(req.params);
    const { method } = payBillSchema.parse(req.body);
    const payment = await billingService.processPayment(
      req.user!.restaurantId,
      orderId,
      method,
    );
    sendSuccess(res, 201, { payment }, "Payment recorded successfully");
  } catch (error) {
    next(error);
  }
}
