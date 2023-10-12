import { JOB_STATUSES } from '$/commonConstantsWithClient';
import type { JobBase, ProdJobModel, TestJobModel } from '$/commonTypesWithClient/models';
import { displayIdParser, jobIdParser } from '$/service/idParsers';
import { customAssert } from '$/service/returnStatus';
import type { Job, Prisma } from '@prisma/client';
import { z } from 'zod';

const toJobBase = (job: Job): JobBase => ({
  id: jobIdParser.parse(job.id),
  displayId: displayIdParser.parse(job.displayId),
  title: job.title,
  prompt: job.prompt,
  status: z.enum(JOB_STATUSES).parse(job.status),
  createdTimestamp: job.createdAt.getTime(),
});

const toProdJobModel = (job: Job): ProdJobModel => ({ ...toJobBase(job), mode: 'prod' });
const toTestJobModel = (job: Job): TestJobModel => ({ ...toJobBase(job), mode: 'test' });

export const jobQuery = {
  findLatestHistory: (tx: Prisma.TransactionClient) =>
    tx.prodJobHistory.findFirst({ orderBy: { createdAt: 'desc' } }),
  findProdJob: async (tx: Prisma.TransactionClient): Promise<ProdJobModel | null> => {
    const history = await jobQuery.findLatestHistory(tx);

    if (history === null) return null;

    const job = await tx.job.findUnique({ where: { id: history.jobId } });
    customAssert(job, 'エラーならロジック修正必須', { history });

    return toProdJobModel(job);
  },
  findTestJobs: async (tx: Prisma.TransactionClient): Promise<TestJobModel[]> => {
    const history = await jobQuery.findLatestHistory(tx);
    const jobs = await tx.job.findMany({ where: { id: { not: history?.jobId } } });

    return jobs.map(toTestJobModel);
  },
};
