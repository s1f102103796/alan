import type { ChatLogModel, CreateJobParams } from '$/commonTypesWithClient/models';
import { transaction } from '$/service/prismaClient';
import { setTimeout } from 'timers/promises';
import { jobMethods } from '../model/jobMethods';
import { chatLogQuery } from '../query/chatLogQuery';
import { jobQuery } from '../query/jobQuery';
import { chatRepo } from '../repository/chatRepo';
import { jobRepo } from '../repository/jobRepo';

export const jobUseCase = {
  create: (params: CreateJobParams, chatLog: ChatLogModel) =>
    transaction(async (tx) => {
      const prodJob = await jobQuery.findProdJob(tx);
      const testJobs = await jobQuery.findTestJobs(tx);
      const job = jobMethods.create(params, prodJob, testJobs, chatLog);

      await jobRepo.save(tx, job);

      return job;
    }),
  pollChatLog: async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await transaction(async (tx) => {
        const logs = await chatLogQuery.fetchNewLogs(tx);
        await Promise.all(logs.map((log) => chatRepo.saveLog(tx, log)));
      });

      await setTimeout(5000);
    }
  },
  autoGenerate: async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await setTimeout(1000);
    }
  },
};
