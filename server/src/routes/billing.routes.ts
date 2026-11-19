import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import * as billingController from "../controllers/billing.controller";

const router = Router();

// All billing routes require a valid JWT.
router.use(authenticate);

// Cashier, Manager, and Admin can access billing.
const canAccessBilling = authorize(Role.CASHIER, Role.MANAGER, Role.ADMIN);

// GET  /api/billing/pending      — list READY orders awaiting payment
router.get("/pending", canAccessBilling, billingController.getPendingBills);

// GET  /api/billing/completed    — list all paid receipts
router.get("/completed", canAccessBilling, billingController.getCompletedBills);

// GET  /api/billing/:orderId     — itemised bill preview (subtotal / GST / total)
router.get("/:orderId", canAccessBilling, billingController.getBillPreview);

// POST /api/billing/:orderId/pay — record payment
router.post(
  "/:orderId/pay",
  canAccessBilling,
  billingController.processPayment,
);

export default router;
