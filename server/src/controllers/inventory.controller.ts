import { NextFunction, Request, Response } from "express";
import * as inventoryService from "../services/inventory.service";
import { sendSuccess } from "../utils/apiResponse";
import {
  adjustStockSchema,
  inventoryIngredientParamSchema,
  stockHistoryQuerySchema,
} from "../validators/inventory.validator";

// ---------------------------------------------------------------------------
// GET /api/inventory/stock
// ---------------------------------------------------------------------------

export async function getCurrentStock(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stock = await inventoryService.getCurrentStock(req.user!.restaurantId);
    sendSuccess(res, 200, { stock });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/inventory/alerts
// ---------------------------------------------------------------------------

export async function getLowStockAlerts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const alerts = await inventoryService.getLowStockAlerts(
      req.user!.restaurantId,
    );
    sendSuccess(res, 200, { alerts });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/inventory/history
// ---------------------------------------------------------------------------

export async function getStockHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = stockHistoryQuerySchema.parse(req.query);
    const history = await inventoryService.getStockHistory(
      req.user!.restaurantId,
      query,
    );
    sendSuccess(res, 200, { history });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/inventory/:ingredientId/adjust
// ---------------------------------------------------------------------------

export async function adjustStock(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ingredientId } = inventoryIngredientParamSchema.parse(req.params);
    const input = adjustStockSchema.parse(req.body);
    const ingredient = await inventoryService.adjustStock(
      req.user!.restaurantId,
      ingredientId,
      input,
    );
    sendSuccess(res, 200, { ingredient }, "Stock adjusted successfully");
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/inventory/summary
// ---------------------------------------------------------------------------

export async function getInventorySummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const summary = await inventoryService.getInventorySummary(
      req.user!.restaurantId,
    );
    sendSuccess(res, 200, { summary });
  } catch (error) {
    next(error);
  }
}
