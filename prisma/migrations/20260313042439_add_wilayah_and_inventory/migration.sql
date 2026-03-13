-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "district" TEXT,
ADD COLUMN     "village" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "reservedStock" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "shipmentStatus" TEXT NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "trackingNumber" DROP NOT NULL;
