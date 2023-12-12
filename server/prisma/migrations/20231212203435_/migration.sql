/*
  Warnings:

  - Made the column `updatedAt` on table `GitHubAction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "GitHubAction" ALTER COLUMN "updatedAt" SET NOT NULL;
