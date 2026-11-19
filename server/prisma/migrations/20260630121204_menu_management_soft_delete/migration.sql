-- AlterTable: Category
ALTER TABLE "Category" ADD COLUMN "description" TEXT;
ALTER TABLE "Category" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Category" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: Ingredient (preserve stock data during column rename)
ALTER TABLE "Ingredient" ADD COLUMN "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0;
UPDATE "Ingredient" SET "currentStock" = "quantityInStock"::double precision;
ALTER TABLE "Ingredient" DROP COLUMN "quantityInStock";
ALTER TABLE "Ingredient" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Ingredient" ALTER COLUMN "lowStockThreshold" DROP NOT NULL;
ALTER TABLE "Ingredient" ALTER COLUMN "lowStockThreshold" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable: MenuItem
ALTER TABLE "MenuItem" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: MenuItemIngredient (unit lives on Ingredient only)
ALTER TABLE "MenuItemIngredient" DROP COLUMN "unit";
ALTER TABLE "MenuItemIngredient" ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;
