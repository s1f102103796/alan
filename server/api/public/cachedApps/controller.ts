import { cachedAppQuery } from '$/domain/app/query/cachedAppQuery';
import { returnGetError, returnSuccess } from '$/service/returnStatus';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () => cachedAppQuery.findAll().then(returnSuccess).catch(returnGetError),
}));
