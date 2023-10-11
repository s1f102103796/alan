import { jobQuery } from '$/domain/job/query/jobQuery';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () => ({ status: 200, body: jobQuery.findAll() }),
  post: () => ({ status: 200, body: jobQuery.findAll()[0] }),
}));
