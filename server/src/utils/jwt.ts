import { createHash } from "node:crypto";
import { Role } from "@prisma/client";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface TokenPayload {
  userId: string;
  restaurantId: string;
  role: Role;
  type: "access" | "refresh";
}

function signToken(
  payload: TokenPayload,
  secret: string,
  expiresIn: SignOptions["expiresIn"],
): string {
  return jwt.sign(payload, secret, { expiresIn });
}

export function signAccessToken(payload: Omit<TokenPayload, "type">): string {
  return signToken(
    { ...payload, type: "access" },
    env.JWT_ACCESS_SECRET,
    env.JWT_ACCESS_EXPIRY as SignOptions["expiresIn"],
  );
}

export function signRefreshToken(payload: Omit<TokenPayload, "type">): string {
  return signToken(
    { ...payload, type: "refresh" },
    env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_EXPIRY as SignOptions["expiresIn"],
  );
}

function verifyTypedToken(token: string, secret: string, expectedType: TokenPayload["type"]): TokenPayload {
  const payload = jwt.verify(token, secret);

  if (
    typeof payload === "string" ||
    payload.type !== expectedType ||
    typeof payload.userId !== "string" ||
    typeof payload.restaurantId !== "string" ||
    !Object.values(Role).includes(payload.role as Role)
  ) {
    throw new jwt.JsonWebTokenError("Invalid token payload");
  }

  return payload as unknown as TokenPayload;
}

export function verifyAccessToken(token: string): TokenPayload {
  return verifyTypedToken(token, env.JWT_ACCESS_SECRET, "access");
}

export function verifyRefreshToken(token: string): TokenPayload {
  return verifyTypedToken(token, env.JWT_REFRESH_SECRET, "refresh");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getTokenExpiry(token: string): Date {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded === "string" || typeof decoded.exp !== "number") {
    throw new jwt.JsonWebTokenError("Token has no expiry");
  }

  return new Date(decoded.exp * 1000);
}
