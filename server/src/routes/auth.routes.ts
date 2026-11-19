import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.post("/register-restaurant", authController.registerRestaurant);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/change-password", authenticate, authController.changePassword);
router.get("/me", authenticate, authController.me);

export default router;
