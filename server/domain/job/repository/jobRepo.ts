import type { Prisma } from '@prisma/client';
import type { JobModel } from 'commonTypesWithClient/models';

export const jobRepo = {
  save: async (tx: Prisma.TransactionClient, job: JobModel) => {
    await tx.job.upsert({
      where: { id: job.id },
      update: { description: job.description },
      create: {
        id: job.id,
        status: job.status,
        description: job.description,
        createdAt: new Date(job.createdTimestamp),
      },
    });
  },
};
