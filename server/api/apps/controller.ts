import { appQuery } from '$/domain/app/query/appQuery';
import { appUseCase } from '$/domain/app/useCase/appUseCase';
import { prismaClient } from '$/service/prismaClient';
import { returnGetError, returnPostError, returnSuccess } from '$/service/returnStatus';
import { z } from 'zod';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () => appQuery.findAll(prismaClient).then(returnSuccess).catch(returnGetError),
  post: {
    validators: { body: z.object({ desc: z.string() }) },
    handler: ({ user, body }) =>
      appUseCase.create(user, body.desc).then(returnSuccess).catch(returnPostError),
  },
}));
