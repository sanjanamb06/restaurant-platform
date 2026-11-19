import { randomInt } from "node:crypto";
import { Role } from "@prisma/client";
import { prisma } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { generateTemporaryPassword, hashPassword, verifyPassword } from "../utils/password";
import { generateGloballyUniqueUsername } from "./employee.service";
import { createTokenPair } from "./token.service";

export interface RegisterRestaurantInput {
  restaurantName: string;
  ownerName: string;
  username: string;
  password: string;
  contactEmail: string;
  phone: string;
  address: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  return base || "restaurant";
}

async function createUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const slug = `${base}-${randomInt(100, 1000)}`;
    const exists = await prisma.restaurant.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
  }

  throw new AppError(500, "Could not generate a restaurant slug");
}

export async function registerRestaurant(input: RegisterRestaurantInput) {
  const existingAdmin = await prisma.user.findUnique({
    where: { username: input.username },
    select: { id: true },
  });
  if (existingAdmin) {
    throw new AppError(409, "This username is already taken, please choose another");
  }

  const slug = await createUniqueSlug(input.restaurantName);
  const adminPasswordHash = await hashPassword(input.password);
  const usedUsernames = new Set([input.username]);
  const generatedEmployees: Array<{
    role: Role;
    name: string;
    username: string;
    temporaryPassword: string;
    passwordHash: string;
  }> = [];

  for (const role of [Role.MANAGER, Role.CHEF, Role.CASHIER] as const) {
    const username = await generateGloballyUniqueUsername(role.toLowerCase(), usedUsernames);
    usedUsernames.add(username);
    const temporaryPassword = generateTemporaryPassword();
    generatedEmployees.push({
      role,
      name: role.charAt(0) + role.slice(1).toLowerCase(),
      username,
      temporaryPassword,
      passwordHash: await hashPassword(temporaryPassword),
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: {
        name: input.restaurantName,
        slug,
        contactEmail: input.contactEmail,
        phone: input.phone,
        address: input.address,
      },
    });

    const admin = await tx.user.create({
      data: {
        restaurantId: restaurant.id,
        name: input.ownerName,
        username: input.username,
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
        mustChangePassword: false,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        mustChangePassword: true,
      },
    });

    await tx.user.createMany({
      data: generatedEmployees.map((employee) => ({
        restaurantId: restaurant.id,
        name: employee.name,
        username: employee.username,
        passwordHash: employee.passwordHash,
        role: employee.role,
        mustChangePassword: true,
      })),
    });

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
      },
      admin,
    };
  });

  return {
    ...result,
    temporaryCredentials: generatedEmployees.map(({ username, role, temporaryPassword }) => ({
      username,
      role,
      temporaryPassword,
    })),
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { username: input.username },
    include: {
      restaurant: {
        select: { id: true, name: true },
      },
    },
  });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError(401, "Invalid username or password");
  }

  if (!user.isActive) {
    throw new AppError(403, "Account disabled");
  }

  const tokens = await createTokenPair({
    userId: user.id,
    restaurantId: user.restaurantId,
    role: user.role,
  });

  return {
    ...tokens,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
    restaurant: user.restaurant,
  };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new AppError(400, "Current password is incorrect");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(newPassword),
      mustChangePassword: false,
    },
  });
}

export async function getCurrentUser(userId: string, restaurantId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, restaurantId },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      restaurant: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!user) throw new AppError(404, "User not found");
  return user;
}
