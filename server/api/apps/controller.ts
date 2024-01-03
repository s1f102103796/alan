import { appUseCase } from '$/domain/app/useCase/appUseCase';
import { returnPostError, returnSuccess } from '$/service/returnStatus';
import { z } from 'zod';
import { defineController } from './$relay';

export default defineController(() => ({
  post: {
    validators: { body: z.object({ desc: z.string() }) },
    handler: ({ user, body }) =>
      appUseCase.create(user, body.desc).then(returnSuccess).catch(returnPostError),
  },
}));
