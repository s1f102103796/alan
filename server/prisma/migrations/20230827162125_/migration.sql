/*
  Warnings:

  - The primary key for the `Dolan` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Dolan" DROP CONSTRAINT "Dolan_pkey",
ADD CONSTRAINT "Dolan_pkey" PRIMARY KEY ("message");
