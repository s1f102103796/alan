import { jobQuery } from '$/domain/job/query/jobQuery';
import { jobUseCase } from '$/domain/job/useCase/jobUseCase';
import { prismaClient } from '$/service/prismaClient';
import { returnGetError, returnPostError, returnSuccess } from '$/service/returnStatus';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () => jobQuery.findAll(prismaClient).then(returnSuccess).catch(returnGetError),
  post: ({ body }) =>
    jobUseCase.create(body.description).then(returnSuccess).catch(returnPostError),
}));
