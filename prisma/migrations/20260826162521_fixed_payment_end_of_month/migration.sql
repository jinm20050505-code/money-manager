-- AlterTable
ALTER TABLE "FixedPayment" ADD COLUMN     "endOfMonth" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "dueDay" DROP NOT NULL;
