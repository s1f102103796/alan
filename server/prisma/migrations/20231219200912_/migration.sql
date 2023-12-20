/*
  Warnings:

  - You are about to drop the column `createdAt` on the `GitHubAction` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `RailwayDeployment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GitHubAction" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "RailwayDeployment" DROP COLUMN "createdAt";
