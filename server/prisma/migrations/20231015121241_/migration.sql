/*
  Warnings:

  - You are about to drop the column `timestamp` on the `ChatLog` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `ProdJobHistory` table. All the data in the column will be lost.
  - Added the required column `createdAt` to the `ChatLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdAt` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdAt` to the `ProdJobHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChatLog" DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ProdJobHistory" DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL;
