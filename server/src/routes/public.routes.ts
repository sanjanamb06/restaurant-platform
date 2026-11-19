import { Router } from "express";
import * as publicController from "../controllers/public.controller";

const router = Router();

router.get("/:restaurantId/menu", publicController.getMenu);
router.get("/:restaurantId/tables", publicController.listTables);
router.post("/:restaurantId/check-table", publicController.checkTable);
router.post("/:restaurantId/orders", publicController.createOrder);
router.post("/:restaurantId/orders/:orderId/join", publicController.joinOrder);
router.get("/:restaurantId/orders/:orderId", publicController.getOrder);

export default router;
