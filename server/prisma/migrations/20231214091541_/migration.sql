/*
  Warnings:

  - You are about to drop the column `bubblesUpdatedAt` on the `App` table. All the data in the column will be lost.
  - Added the required column `branch` to the `GitHubAction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commitId` to the `GitHubAction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "App" DROP COLUMN "bubblesUpdatedAt",
ADD COLUMN     "githubUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "railwayUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "GitHubAction" ADD COLUMN     "branch" TEXT NOT NULL,
ADD COLUMN     "commitId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "RailwayDeployment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "commitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bubbleId" TEXT NOT NULL,

    CONSTRAINT "RailwayDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RailwayDeployment_bubbleId_key" ON "RailwayDeployment"("bubbleId");

-- AddForeignKey
ALTER TABLE "RailwayDeployment" ADD CONSTRAINT "RailwayDeployment_bubbleId_fkey" FOREIGN KEY ("bubbleId") REFERENCES "Bubble"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
