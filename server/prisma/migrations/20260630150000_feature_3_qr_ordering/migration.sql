-- Feature 3: public QR ordering.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'SERVED';

ALTER TABLE "GuestSession" ADD COLUMN "customerName" TEXT;
UPDATE "GuestSession" SET "customerName" = 'Guest' WHERE "customerName" IS NULL;
ALTER TABLE "GuestSession" ALTER COLUMN "customerName" SET NOT NULL;

ALTER TABLE "Order" ADD COLUMN "orderNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "customerName" TEXT;

WITH numbered_orders AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "restaurantId"
      ORDER BY "createdAt", id
    ) AS sequence_number
  FROM "Order"
)
UPDATE "Order" AS order_row
SET "orderNumber" = 'ORD-' || LPAD(numbered_orders.sequence_number::TEXT, 4, '0')
FROM numbered_orders
WHERE order_row.id = numbered_orders.id;

UPDATE "Order" AS order_row
SET "customerName" = guest_session."customerName"
FROM "GuestSession" AS guest_session
WHERE order_row."guestSessionId" = guest_session.id
  AND order_row."customerName" IS NULL;

UPDATE "Order" SET "customerName" = 'Guest' WHERE "customerName" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "customerName" SET NOT NULL;

ALTER TABLE "OrderItem"
ALTER COLUMN "priceAtOrder" TYPE DOUBLE PRECISION
USING "priceAtOrder"::DOUBLE PRECISION;

CREATE TABLE "IdempotencyRecord" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "responseSnapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IdempotencyRecord_key_key" ON "IdempotencyRecord"("key");
CREATE UNIQUE INDEX "Order_restaurantId_orderNumber_key" ON "Order"("restaurantId", "orderNumber");
CREATE UNIQUE INDEX "OrderItem_orderId_menuItemId_key" ON "OrderItem"("orderId", "menuItemId");
