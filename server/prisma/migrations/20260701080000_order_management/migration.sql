-- order_management migration
-- 1. Add totalAmount column to Order (nullable Float)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "totalAmount" DOUBLE PRECISION;

-- 2. Remove enum values CONFIRMED, SERVED, COMPLETED from OrderStatus
--    PostgreSQL does not support DROP VALUE from enums directly.
--    Strategy: create a new enum, drop column default, swap the column type,
--    restore default, then drop old enum.

-- Rename old enum
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";

-- Create the simplified enum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'CANCELLED');

-- Drop default so the column can be re-typed
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;

-- Migrate existing column: map any removed values to CANCELLED
ALTER TABLE "Order"
  ALTER COLUMN "status" TYPE "OrderStatus"
  USING (
    CASE "status"::text
      WHEN 'PENDING'    THEN 'PENDING'::"OrderStatus"
      WHEN 'PREPARING'  THEN 'PREPARING'::"OrderStatus"
      WHEN 'READY'      THEN 'READY'::"OrderStatus"
      WHEN 'CANCELLED'  THEN 'CANCELLED'::"OrderStatus"
      -- CONFIRMED, SERVED, COMPLETED -> CANCELLED (dev env, safe to coerce)
      ELSE 'CANCELLED'::"OrderStatus"
    END
  );

-- Restore default
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"OrderStatus";

-- Drop old enum
DROP TYPE "OrderStatus_old";
