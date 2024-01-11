/*
  Warnings:

  - Added the required column `similarName` to the `App` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "App" ADD COLUMN     "similarName" TEXT NOT NULL;
