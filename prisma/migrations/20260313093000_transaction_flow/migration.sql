-- This migration runs after `20260313032852_separate_payment_order_status`,
-- where Transaction.status / TransactionStatus were replaced with
-- paymentStatus + orderStatus enums.

-- Add user shipping addresses
CREATE TABLE IF NOT EXISTS "Address" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "addressLine" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "province" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Address"
  ADD CONSTRAINT "Address_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Transaction should bind to one address snapshot reference
ALTER TABLE "Transaction"
  ADD COLUMN "addressId" TEXT;

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_addressId_fkey"
  FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- If there is preexisting transaction data, fill addressId manually before making it required.
ALTER TABLE "Transaction"
  ALTER COLUMN "addressId" SET NOT NULL;

-- Rename order item snapshot field
ALTER TABLE "TransactionItem"
  RENAME COLUMN "price" TO "priceSnapshot";

-- Add shipment records for fulfillment stage
CREATE TABLE IF NOT EXISTS "Shipment" (
  "id" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "courier" TEXT NOT NULL,
  "trackingNumber" TEXT NOT NULL,
  "shippingCost" DOUBLE PRECISION NOT NULL,
  "shippedAt" TIMESTAMP(3),
  "estimatedDelivery" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Shipment_transactionId_key" ON "Shipment"("transactionId");

ALTER TABLE "Shipment"
  ADD CONSTRAINT "Shipment_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
