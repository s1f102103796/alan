import { appQuery } from '$/domain/app/query/appQuery';
import { prismaClient } from '$/service/prismaClient';
import { returnGetError, returnSuccess } from '$/service/returnStatus';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () => appQuery.findAll(prismaClient).then(returnSuccess).catch(returnGetError),
}));
