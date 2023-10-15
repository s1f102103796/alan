/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ProdJobHistory` table. All the data in the column will be lost.
  - Added the required column `chatLogId` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `ProdJobHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "createdAt",
ADD COLUMN     "chatLogId" TEXT NOT NULL,
ADD COLUMN     "timestamp" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ProdJobHistory" DROP COLUMN "createdAt",
ADD COLUMN     "timestamp" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "ChatLog" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "s3Key" TEXT,
    "inputTokenCount" INTEGER,
    "outputTokenCount" INTEGER,
    "timestamp" INTEGER NOT NULL,

    CONSTRAINT "ChatLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_chatLogId_fkey" FOREIGN KEY ("chatLogId") REFERENCES "ChatLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
