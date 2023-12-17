import { appQuery } from '$/domain/app/query/appQuery';
import { appUseCase } from '$/domain/app/useCase/appUseCase';
import { prismaClient } from '$/service/prismaClient';
import { returnPatchError, returnSuccess } from '$/service/returnStatus';
import { defineController } from './$relay';

export default defineController(() => ({
  patch: ({ body }) =>
    appUseCase
      .updateGHActions(body.appId)
      .then(() => appUseCase.updateRWDeployments(body.appId))
      .then(() => appQuery.findByIdOrThrow(prismaClient, body.appId))
      .then(returnSuccess)
      .catch(returnPatchError),
}));
