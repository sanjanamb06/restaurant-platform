-- CreateEnum
CREATE TYPE "StockChangeReason" AS ENUM ('ORDER_DEDUCTION', 'MANUAL_ADJUSTMENT');

-- CreateTable
CREATE TABLE "StockHistory" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "changeAmount" DOUBLE PRECISION NOT NULL,
    "reason" "StockChangeReason" NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockHistory_restaurantId_idx" ON "StockHistory"("restaurantId");

-- CreateIndex
CREATE INDEX "StockHistory_ingredientId_idx" ON "StockHistory"("ingredientId");

-- CreateIndex
CREATE INDEX "StockHistory_restaurantId_createdAt_idx" ON "StockHistory"("restaurantId", "createdAt");

-- AddForeignKey
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
