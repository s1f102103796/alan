import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

export const prismaClient = new PrismaClient();

export const transaction = <U>(
  isolationLevel: Prisma.TransactionIsolationLevel,
  fn: (tx: Prisma.TransactionClient) => Promise<U>
) => prismaClient.$transaction<U>(fn, { isolationLevel });
