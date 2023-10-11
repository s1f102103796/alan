import type { JobModel } from '$/commonTypesWithClient/models';
import { jobIdParser } from '$/service/idParsers';
import type { Job, Prisma } from '@prisma/client';
import { z } from 'zod';

const toJobModel = (job: Job): JobModel => ({
  id: jobIdParser.parse(job.id),
  description: job.description,
  status: z.enum(['running', 'stopped', 'archived']).parse(job.status),
  createdTimestamp: job.createdAt.getTime(),
});

export const jobQuery = {
  findAll: (tx: Prisma.TransactionClient): Promise<JobModel[]> =>
    tx.job.findMany().then((jobs) => jobs.map(toJobModel)),
};
