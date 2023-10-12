import type { CreateJobParams } from '$/commonTypesWithClient/models';
import { transaction } from '$/service/prismaClient';
import { jobMethods } from '../model/jobMethods';
import { jobQuery } from '../query/jobQuery';
import { jobRepo } from '../repository/jobRepo';

export const jobUseCase = {
  create: (params: CreateJobParams) =>
    transaction(async (tx) => {
      const prodJob = await jobQuery.findProdJob(tx);
      const testJobs = await jobQuery.findTestJobs(tx);
      const job = jobMethods.create(params, prodJob, testJobs);

      await jobRepo.save(tx, job);

      return job;
    }),
};
