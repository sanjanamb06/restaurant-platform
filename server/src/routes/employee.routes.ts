import { Role } from "@prisma/client";
import { Router } from "express";
import * as employeeController from "../controllers/employee.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { requirePasswordChange } from "../middleware/requirePasswordChange";

const router = Router();

router.use(authenticate, requirePasswordChange, authorize(Role.ADMIN));

router.post("/", employeeController.createEmployee);
router.get("/", employeeController.listEmployees);
router.patch("/:id", employeeController.updateEmployee);
router.patch("/:id/toggle-status", employeeController.toggleEmployeeStatus);
router.post("/:id/reset-password", employeeController.resetEmployeePassword);

export default router;
