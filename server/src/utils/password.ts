import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
const ALPHANUMERIC = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateTemporaryPassword(length = 10): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => ALPHANUMERIC[byte % ALPHANUMERIC.length]).join("");
}
