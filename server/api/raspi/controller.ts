import { postRaspi } from '$/repository/raspiRepository';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () => ({ status: 200, body: 'Hello' }),
  post: async ({ body }) => ({ status: 201, body: await postRaspi(body.id) }),
}));
