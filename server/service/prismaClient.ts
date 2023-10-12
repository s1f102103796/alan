import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

export const prismaClient = new PrismaClient();

export const transaction = <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) =>
  prismaClient.$transaction(fn, { isolationLevel: 'Serializable' });
