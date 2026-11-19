import { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler";

const ALLOWED_PATHS = new Set([
  "/api/auth/change-password",
  "/api/auth/logout",
  "/api/auth/me",
]);

export function requirePasswordChange(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.mustChangePassword && !ALLOWED_PATHS.has(req.originalUrl.split("?")[0])) {
    next(new AppError(403, "Password change required before accessing this resource"));
    return;
  }

  next();
}
