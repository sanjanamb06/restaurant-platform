import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import * as inventoryController from "../controllers/inventory.controller";

const router = Router();

router.use(authenticate);

// CASHIER, MANAGER, ADMIN can view current stock (useful for cashier awareness)
const canReadStock = authorize(Role.CASHIER, Role.MANAGER, Role.ADMIN);

// Only MANAGER and ADMIN can view alerts, history, adjust, see summary
const canManageInventory = authorize(Role.MANAGER, Role.ADMIN);

// GET  /api/inventory/stock                   — all ingredients with low-stock flags
router.get("/stock", canReadStock, inventoryController.getCurrentStock);

// GET  /api/inventory/summary                 — aggregate KPIs
router.get("/summary", canManageInventory, inventoryController.getInventorySummary);

// GET  /api/inventory/alerts                  — below-threshold ingredients only
router.get("/alerts", canManageInventory, inventoryController.getLowStockAlerts);

// GET  /api/inventory/history                 — paginated audit trail
router.get("/history", canManageInventory, inventoryController.getStockHistory);

// POST /api/inventory/:ingredientId/adjust    — manual adjustment
router.post(
  "/:ingredientId/adjust",
  canManageInventory,
  inventoryController.adjustStock,
);

export default router;
