/*
  Warnings:

  - You are about to drop the column `description` on the `Job` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[displayId]` on the table `Job` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `displayId` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prompt` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "description",
ADD COLUMN     "displayId" TEXT NOT NULL,
ADD COLUMN     "prompt" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ProdJobHistory" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProdJobHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_displayId_key" ON "Job"("displayId");

-- AddForeignKey
ALTER TABLE "ProdJobHistory" ADD CONSTRAINT "ProdJobHistory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
