import { appUseCase } from '$/domain/app/useCase/appUseCase';
import { returnPatchError, returnSuccess } from '$/service/returnStatus';
import { defineController } from './$relay';

export default defineController(() => ({
  patch: ({ body }) =>
    appUseCase
      .updateGHActions(body.appId)
      .then(() => appUseCase.updateRWDeployments(body.appId))
      .then(returnSuccess)
      .catch(returnPatchError),
}));
