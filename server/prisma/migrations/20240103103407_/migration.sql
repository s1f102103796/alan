/*
  Warnings:

  - You are about to drop the column `githubUpdatedAt` on the `App` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "App" DROP COLUMN "githubUpdatedAt";

-- AlterTable
ALTER TABLE "GitHubAction" ADD COLUMN     "conclusion" TEXT;
