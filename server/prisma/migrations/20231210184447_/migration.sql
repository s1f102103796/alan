/*
  Warnings:

  - You are about to drop the `ChatLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProdJobHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_chatLogId_fkey";

-- DropForeignKey
ALTER TABLE "ProdJobHistory" DROP CONSTRAINT "ProdJobHistory_jobId_fkey";

-- DropTable
DROP TABLE "ChatLog";

-- DropTable
DROP TABLE "Job";

-- DropTable
DROP TABLE "ProdJobHistory";
