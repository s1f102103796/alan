import { appUseCase } from '$/domain/app/useCase/appUseCase';
import { returnPostError, returnSuccess } from '$/service/returnStatus';
import { defineController } from './$relay';

export default defineController(() => ({
  post: ({ user, body }) =>
    appUseCase.create(user, body.desc).then(returnSuccess).catch(returnPostError),
}));
