import { runNewsAPI_LANGCHAIN } from '$/repository/newsapiRepository';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () => ({ status: 200, body: 'Hello' }),
  post: async () => ({
    status: 201,
    body: await runNewsAPI_LANGCHAIN(),
  }),
  // post: async ({ body }) => ({
  //   status: 201,
  //   body: await runTemplete(body.people),
  // }),
}));
