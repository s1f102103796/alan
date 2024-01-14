import { appIdParser } from '$/commonTypesWithClient/idParsers';
import { appQuery } from '$/domain/app/query/appQuery';
import { appUseCase } from '$/domain/app/useCase/appUseCase';
import { prismaClient } from '$/service/prismaClient';
import {
  returnGetError,
  returnPatchError,
  returnPostError,
  returnSuccess,
} from '$/service/returnStatus';
import { z } from 'zod';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () => appQuery.findAll(prismaClient).then(returnSuccess).catch(returnGetError),
  post: {
    validators: { body: z.object({ name: z.string(), similarName: z.string() }) },
    handler: ({ user, body }) =>
      appUseCase
        .create(user, body.name, body.similarName)
        .then(returnSuccess)
        .catch(returnPostError),
  },
  patch: {
    validators: { body: z.object({ appId: appIdParser, content: z.string() }) },
    handler: ({ user, body }) =>
      appUseCase
        .changeRequest(user, body.appId, body.content)
        .then(returnSuccess)
        .catch(returnPatchError),
  },
}));
