import { defineController } from './$relay';

export default defineController(() => ({
  post: ({ user }) => {
    return { status: 200, body: user };
  },
}));
