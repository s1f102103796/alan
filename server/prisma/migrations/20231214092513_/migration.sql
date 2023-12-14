/*
  Warnings:

  - Made the column `githubUpdatedAt` on table `App` required. This step will fail if there are existing NULL values in that column.
  - Made the column `railwayUpdatedAt` on table `App` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "App" ALTER COLUMN "githubUpdatedAt" SET NOT NULL,
ALTER COLUMN "railwayUpdatedAt" SET NOT NULL;
