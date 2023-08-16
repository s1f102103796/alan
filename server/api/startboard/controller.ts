import { boardUseCace } from '$/useCase/boardUseCase';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () => ({ status: 200, body: 'Hello' }),
  post: () => {
    boardUseCace.startBoard();
    return { status: 201 };
  },
}));
