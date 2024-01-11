import { appUseCase } from '$/domain/app/useCase/appUseCase';
import { userQuery } from '$/domain/user/query/userQuery';
import { DEUS_LO_VULT_TOKEN, GITHUB_OWNER } from '$/service/envValues';
import { returnPostError, returnSuccess } from '$/service/returnStatus';
import { z } from 'zod';
import { defineController } from './$relay';

export default defineController(() => ({
  post: {
    validators: {
      headers: z.object({ authorization: z.string() }),
      body: z.object({ name: z.string(), similarName: z.string() }),
    },
    handler: ({ headers, body }) =>
      headers.authorization === `Bearer ${DEUS_LO_VULT_TOKEN}`
        ? userQuery
            .findByGithubIdOrThrow(GITHUB_OWNER)
            .then((user) => appUseCase.create(user, body.name, body.similarName))
            .then(returnSuccess)
            .catch(returnPostError)
        : Promise.resolve(returnPostError(new Error('Bearer token did not match.'))),
  },
}));
