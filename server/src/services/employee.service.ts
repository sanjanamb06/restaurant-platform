import { randomBytes } from "node:crypto";
import { Role } from "@prisma/client";
import { prisma } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { generateTemporaryPassword, hashPassword } from "../utils/password";

const EMPLOYEE_ROLES: Role[] = [Role.MANAGER, Role.CHEF, Role.CASHIER];

export interface CreateEmployeeInput {
  name: string;
  username: string;
  role: Role;
}

export interface UpdateEmployeeInput {
  name?: string;
  username?: string;
  role?: Role;
}

function ensureEmployeeRole(role: Role): void {
  if (!EMPLOYEE_ROLES.includes(role)) {
    throw new AppError(400, "Employee role must be MANAGER, CHEF, or CASHIER");
  }
}

async function findEmployeeOrThrow(id: string, restaurantId: string) {
  const employee = await prisma.user.findFirst({
    where: { id, restaurantId, role: { not: Role.ADMIN } },
  });

  if (!employee) throw new AppError(404, "Employee not found");
  return employee;
}

export async function generateGloballyUniqueUsername(
  base: string,
  reservedUsernames: ReadonlySet<string> = new Set(),
): Promise<string> {
  const baseExists =
    reservedUsernames.has(base) ||
    Boolean(await prisma.user.findFirst({ where: { username: base }, select: { id: true } }));

  if (!baseExists) return base;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `${base}_${randomBytes(2).toString("hex")}`;
    const exists =
      reservedUsernames.has(candidate) ||
      Boolean(await prisma.user.findFirst({ where: { username: candidate }, select: { id: true } }));
    if (!exists) return candidate;
  }

  throw new AppError(500, "Could not generate a unique username");
}

async function resolveEmployeeUsername(requestedUsername: string, role: Role): Promise<string> {
  const existing = await prisma.user.findFirst({
    where: { username: requestedUsername },
    select: { id: true },
  });

  if (!existing) return requestedUsername;

  const roleBase = role.toLowerCase();
  if (requestedUsername !== roleBase) {
    throw new AppError(409, "This username is already taken, please choose another");
  }

  return generateGloballyUniqueUsername(roleBase);
}

export async function createEmployee(restaurantId: string, input: CreateEmployeeInput) {
  ensureEmployeeRole(input.role);
  const username = await resolveEmployeeUsername(input.username, input.role);
  const temporaryPassword = generateTemporaryPassword();
  const employee = await prisma.user.create({
    data: {
      restaurantId,
      name: input.name,
      username,
      role: input.role,
      passwordHash: await hashPassword(temporaryPassword),
      mustChangePassword: true,
    },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
    },
  });

  return { employee, temporaryPassword };
}

export function listEmployees(restaurantId: string) {
  return prisma.user.findMany({
    where: { restaurantId },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function updateEmployee(
  id: string,
  restaurantId: string,
  input: UpdateEmployeeInput,
) {
  await findEmployeeOrThrow(id, restaurantId);
  if (input.role) ensureEmployeeRole(input.role);

  if (input.username) {
    const existing = await prisma.user.findFirst({
      where: { username: input.username },
      select: { id: true },
    });
    if (existing && existing.id !== id) {
      throw new AppError(409, "This username is already taken, please choose another");
    }
  }

  return prisma.user.update({
    where: { id },
    data: input,
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      updatedAt: true,
    },
  });
}

export async function toggleEmployeeStatus(id: string, restaurantId: string) {
  const employee = await findEmployeeOrThrow(id, restaurantId);
  const isActive = !employee.isActive;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    if (!isActive) {
      await tx.refreshToken.updateMany({
        where: { userId: id, restaurantId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return updated;
  });
}

export async function resetEmployeePassword(id: string, restaurantId: string) {
  await findEmployeeOrThrow(id, restaurantId);
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const employee = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        mustChangePassword: true,
      },
    });

    await tx.refreshToken.updateMany({
      where: { userId: id, restaurantId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return updated;
  });

  return { employee, temporaryPassword };
}
