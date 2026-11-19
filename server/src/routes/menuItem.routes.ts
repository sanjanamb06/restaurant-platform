import { Role } from "@prisma/client";
import { Router } from "express";
import * as menuItemController from "../controllers/menuItem.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { requirePasswordChange } from "../middleware/requirePasswordChange";

const router = Router();

const readAuth = [authenticate, requirePasswordChange];
const writeAuth = [authenticate, requirePasswordChange, authorize(Role.ADMIN, Role.MANAGER)];

router.get("/", ...readAuth, menuItemController.listMenuItems);
router.get("/:id", ...readAuth, menuItemController.getMenuItem);
router.post("/", ...writeAuth, menuItemController.createMenuItem);
router.patch("/:id", ...writeAuth, menuItemController.updateMenuItem);
router.delete("/:id", ...writeAuth, menuItemController.deleteMenuItem);

export default router;
