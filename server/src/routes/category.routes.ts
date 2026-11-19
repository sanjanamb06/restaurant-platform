import { Role } from "@prisma/client";
import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { requirePasswordChange } from "../middleware/requirePasswordChange";

const router = Router();

const readAuth = [authenticate, requirePasswordChange];
const writeAuth = [authenticate, requirePasswordChange, authorize(Role.ADMIN, Role.MANAGER)];

router.get("/", ...readAuth, categoryController.listCategories);
router.get("/:id", ...readAuth, categoryController.getCategory);
router.post("/", ...writeAuth, categoryController.createCategory);
router.patch("/:id", ...writeAuth, categoryController.updateCategory);
router.delete("/:id", ...writeAuth, categoryController.deleteCategory);

export default router;
