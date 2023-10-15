import { JOB_STATUSES } from '$/commonConstantsWithClient';
import type { JobBase, ProdJobModel, TestJobModel } from '$/commonTypesWithClient/models';
import {
  chatLogIdParser,
  claudeModelIdParser,
  displayIdParser,
  jobIdParser,
} from '$/service/idParsers';
import { customAssert } from '$/service/returnStatus';
import type { ChatLog, Job, Prisma } from '@prisma/client';
import { z } from 'zod';

const toJobBase = (job: Job & { ChatLog: ChatLog }): JobBase => ({
  id: jobIdParser.parse(job.id),
  displayId: displayIdParser.parse(job.displayId),
  title: job.title,
  prompt: job.prompt,
  status: z.enum(JOB_STATUSES).parse(job.status),
  timestamp: job.createdAt.getTime(),
  chatLog: {
    id: chatLogIdParser.parse(job.ChatLog.id),
    modelId: claudeModelIdParser.parse(job.ChatLog.modelId),
    timestamp: job.ChatLog.createdAt.getTime(),
    ...(job.ChatLog.s3Key === null
      ? { status: 'loading' as const }
      : job.ChatLog.status === 'success' &&
        job.ChatLog.inputTokenCount !== null &&
        job.ChatLog.outputTokenCount !== null
      ? {
          status: 'success' as const,
          s3: {
            Key: job.ChatLog.s3Key,
            tokenCount: {
              input: job.ChatLog.inputTokenCount,
              output: job.ChatLog.outputTokenCount,
            },
          },
        }
      : { status: 'failure' as const, s3: { Key: job.ChatLog.s3Key } }),
  },
});

export const jobQuery = {
  findLatestHistory: (tx: Prisma.TransactionClient) =>
    tx.prodJobHistory.findFirst({ orderBy: { createdAt: 'desc' } }),
  findProdJob: async (tx: Prisma.TransactionClient): Promise<ProdJobModel | null> => {
    const history = await jobQuery.findLatestHistory(tx);

    if (history === null) return null;

    const job = await tx.job.findUnique({
      where: { id: history.jobId },
      include: { ChatLog: true },
    });
    customAssert(job, 'エラーならロジック修正必須', { history });

    return { ...toJobBase(job), mode: 'prod' };
  },
  findTestJobs: async (tx: Prisma.TransactionClient): Promise<TestJobModel[]> => {
    const history = await jobQuery.findLatestHistory(tx);
    const jobs = await tx.job.findMany({
      where: { id: { not: history?.jobId } },
      include: { ChatLog: true },
    });

    return jobs.map((job) => ({ ...toJobBase(job), mode: 'test' }));
  },
};
