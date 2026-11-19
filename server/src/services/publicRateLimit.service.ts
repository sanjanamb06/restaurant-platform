import { AppError } from "../middleware/errorHandler";

const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_TTL_MS = 60_000;

interface RateLimitEntry {
  lastRequestAt: number;
  idempotencyKey?: string;
}

const recentOrderRequests = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries(now: number) {
  for (const [key, entry] of recentOrderRequests.entries()) {
    if (now - entry.lastRequestAt > RATE_LIMIT_TTL_MS) {
      recentOrderRequests.delete(key);
    }
  }
}

export function assertPublicOrderRateLimit(key: string, idempotencyKey?: string): void {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const existing = recentOrderRequests.get(key);
  const isSameIdempotentRetry =
    Boolean(idempotencyKey) && existing?.idempotencyKey === idempotencyKey;

  if (
    existing &&
    now - existing.lastRequestAt < RATE_LIMIT_WINDOW_MS &&
    !isSameIdempotentRetry
  ) {
    throw new AppError(429, "Slow down a little — your last order is still being processed");
  }

  recentOrderRequests.set(key, { lastRequestAt: now, idempotencyKey });
}
