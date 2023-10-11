import { prismaClient } from '$/service/prismaClient';
import { jobMethods } from '../model/jobMethods';
import { jobRepo } from '../repository/jobRepo';

export const jobUseCase = {
  create: (description: string) =>
    prismaClient.$transaction(async (tx) => {
      const job = jobMethods.create(description);

      await jobRepo.save(tx, job);

      return job;
    }),
};
