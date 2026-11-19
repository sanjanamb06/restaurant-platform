import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import * as orderController from "../controllers/order.controller";

const router = Router();

// All order routes require a valid JWT.
router.use(authenticate);

// Cashier + all management roles can list/view orders.
const canReadOrders = authorize(Role.ADMIN, Role.MANAGER, Role.CHEF, Role.CASHIER);

// Only the roles that can mutate status need a route — permission per-transition
// is enforced inside the service, so we allow all four roles on the PATCH route
// and let the service reject cashiers (they'll never call it from the UI, but
// the HTTP layer should also reject them).
const canMutateStatus = authorize(Role.ADMIN, Role.MANAGER, Role.CHEF);

router.get("/", canReadOrders, orderController.listOrders);
router.get("/:id", canReadOrders, orderController.getOrder);
router.patch("/:id/status", canMutateStatus, orderController.updateOrderStatus);

export default router;
