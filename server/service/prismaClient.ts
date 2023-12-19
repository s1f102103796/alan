import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

export const prismaClient = new PrismaClient();

export const transaction = <U>(
  fn: (tx: Prisma.TransactionClient) => Promise<U>,
  isolationLevel: Prisma.TransactionIsolationLevel
) => prismaClient.$transaction<U>(fn, { isolationLevel });
