/*
  Warnings:

  - Made the column `bubblesUpdatedAt` on table `App` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "App" ALTER COLUMN "bubblesUpdatedAt" SET NOT NULL;
