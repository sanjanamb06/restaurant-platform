import { Router } from "express";
import aiRoutes from "./ai.routes";
import analyticsRoutes from "./analytics.routes";
import authRoutes from "./auth.routes";
import billingRoutes from "./billing.routes";
import categoryRoutes from "./category.routes";
import employeeRoutes from "./employee.routes";
import ingredientRoutes from "./ingredient.routes";
import inventoryRoutes from "./inventory.routes";
import menuItemRoutes from "./menuItem.routes";
import orderRoutes from "./order.routes";
import publicRoutes from "./public.routes";
import recipeRoutes from "./recipe.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/public", publicRoutes);
router.use("/employees", employeeRoutes);
router.use("/categories", categoryRoutes);
router.use("/ingredients", ingredientRoutes);
router.use("/menu", recipeRoutes);
router.use("/menu", menuItemRoutes);
router.use("/orders", orderRoutes);
router.use("/billing", billingRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/ai", aiRoutes);

export default router;
