import { Role } from "@prisma/client";
import { prisma } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import {
  getTokenExpiry,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

interface TokenOwner {
  userId: string;
  restaurantId: string;
  role: Role;
}

export async function createTokenPair(owner: TokenOwner) {
  const accessToken = signAccessToken(owner);
  const refreshToken = signRefreshToken(owner);

  await prisma.refreshToken.create({
    data: {
      userId: owner.userId,
      restaurantId: owner.restaurantId,
      tokenHash: hashToken(refreshToken),
      expiresAt: getTokenExpiry(refreshToken),
    },
  });

  return { accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  let payload: ReturnType<typeof verifyRefreshToken>;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: {
      user: {
        select: { isActive: true, role: true },
      },
    },
  });

  if (
    !storedToken ||
    storedToken.userId !== payload.userId ||
    storedToken.restaurantId !== payload.restaurantId ||
    storedToken.revokedAt ||
    storedToken.expiresAt <= new Date()
  ) {
    throw new AppError(401, "Refresh token is invalid or revoked");
  }

  if (!storedToken.user.isActive) {
    throw new AppError(403, "Account disabled");
  }

  return signAccessToken({
    userId: storedToken.userId,
    restaurantId: storedToken.restaurantId,
    role: storedToken.user.role,
  });
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashToken(refreshToken),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}
