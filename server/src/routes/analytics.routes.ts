import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import * as analyticsController from "../controllers/analytics.controller";

const router = Router();

router.use(authenticate);
router.use(authorize(Role.MANAGER, Role.ADMIN)); // Only managers & admins

router.get("/revenue", analyticsController.getRevenueData);
router.get("/orders", analyticsController.getOrderVolumeData);
router.get("/popular-items", analyticsController.getPopularItems);
router.get("/ingredient-usage", analyticsController.getIngredientUsageData);

export default router;
