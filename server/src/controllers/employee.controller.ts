import { Role } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as employeeService from "../services/employee.service";
import { sendSuccess } from "../utils/apiResponse";

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .regex(/^[a-zA-Z0-9_]+$/, "Username must contain only letters, numbers, and underscores")
  .transform((value) => value.toLowerCase());

const employeeRoleSchema = z.enum([Role.MANAGER, Role.CHEF, Role.CASHIER]);
const employeeIdSchema = z.string().min(1, "Employee ID is required");

const createEmployeeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  username: usernameSchema,
  role: employeeRoleSchema,
});

const updateEmployeeSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    username: usernameSchema.optional(),
    role: employeeRoleSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export async function createEmployee(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await employeeService.createEmployee(
      req.user!.restaurantId,
      createEmployeeSchema.parse(req.body),
    );
    sendSuccess(res, 201, data, "Employee created successfully");
  } catch (error) {
    next(error);
  }
}

export async function listEmployees(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const employees = await employeeService.listEmployees(req.user!.restaurantId);
    sendSuccess(res, 200, { employees });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployee(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = employeeIdSchema.parse(req.params.id);
    const employee = await employeeService.updateEmployee(
      id,
      req.user!.restaurantId,
      updateEmployeeSchema.parse(req.body),
    );
    sendSuccess(res, 200, { employee }, "Employee updated successfully");
  } catch (error) {
    next(error);
  }
}

export async function toggleEmployeeStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = employeeIdSchema.parse(req.params.id);
    const employee = await employeeService.toggleEmployeeStatus(id, req.user!.restaurantId);
    sendSuccess(res, 200, { employee }, `Employee ${employee.isActive ? "enabled" : "disabled"}`);
  } catch (error) {
    next(error);
  }
}

export async function resetEmployeePassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = employeeIdSchema.parse(req.params.id);
    const data = await employeeService.resetEmployeePassword(id, req.user!.restaurantId);
    sendSuccess(res, 200, data, "Employee password reset successfully");
  } catch (error) {
    next(error);
  }
}
