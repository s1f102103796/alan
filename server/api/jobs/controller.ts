import { jobQuery } from '$/domain/job/query/jobQuery';
import { prismaClient } from '$/service/prismaClient';
import { returnGetError, returnSuccess } from '$/service/returnStatus';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () =>
    Promise.all([jobQuery.findProdJob(prismaClient), jobQuery.findTestJobs(prismaClient)])
      .then(([prod, tests]) => ({ prod, tests }))
      .then(returnSuccess)
      .catch(returnGetError),
}));
