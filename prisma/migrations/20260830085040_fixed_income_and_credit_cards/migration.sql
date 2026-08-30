-- AlterTable
ALTER TABLE "FixedPayment" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'expense';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "creditCardId" INTEGER,
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'cash';

-- CreateTable
CREATE TABLE "CreditCard" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "paymentDay" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
