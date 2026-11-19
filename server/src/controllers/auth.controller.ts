import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service";
import * as tokenService from "../services/token.service";
import { sendSuccess } from "../utils/apiResponse";

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .regex(/^[a-zA-Z0-9_]+$/, "Username must contain only letters, numbers, and underscores")
  .transform((value) => value.toLowerCase());

const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

const registerSchema = z.object({
  restaurantName: z.string().trim().min(2).max(100),
  ownerName: z.string().trim().min(2).max(100),
  username: usernameSchema,
  password: passwordSchema,
  contactEmail: z.string().trim().email(),
  phone: z.string().trim().min(5).max(30),
  address: z.string().trim().min(3).max(300),
});

const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });

export async function registerRestaurant(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await authService.registerRestaurant(registerSchema.parse(req.body));
    sendSuccess(res, 201, data, "Restaurant registered successfully");
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await authService.login(loginSchema.parse(req.body));
    sendSuccess(res, 200, data, "Login successful");
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const accessToken = await tokenService.refreshAccessToken(refreshToken);
    sendSuccess(res, 200, { accessToken }, "Access token refreshed");
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    await tokenService.revokeRefreshToken(refreshToken);
    sendSuccess(res, 200, null, "Logout successful");
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user!.userId, currentPassword, newPassword);
    sendSuccess(res, 200, null, "Password changed successfully");
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await authService.getCurrentUser(req.user!.userId, req.user!.restaurantId);
    sendSuccess(res, 200, data);
  } catch (error) {
    next(error);
  }
}
