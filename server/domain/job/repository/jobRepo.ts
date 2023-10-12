import type { Prisma } from '@prisma/client';
import type { JobModel } from 'commonTypesWithClient/models';
import { randomUUID } from 'crypto';
import { jobQuery } from '../query/jobQuery';

export const jobRepo = {
  save: async (tx: Prisma.TransactionClient, job: JobModel) => {
    await tx.job.upsert({
      where: { id: job.id },
      update: { title: job.title, prompt: job.prompt, status: job.status },
      create: {
        id: job.id,
        displayId: job.displayId,
        title: job.title,
        prompt: job.prompt,
        status: job.status,
        createdAt: new Date(job.createdTimestamp),
      },
    });

    if (job.mode === 'test') return;

    const history = await jobQuery.findLatestHistory(tx);

    if (history?.jobId === job.id) return;

    await tx.prodJobHistory.create({
      data: { id: randomUUID(), jobId: job.id, createdAt: new Date() },
    });
  },
};
