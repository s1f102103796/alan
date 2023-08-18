import { boardUseCace } from '$/useCase/boardUseCase';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () => ({ status: 200, body: boardUseCace.getTurn() }),
  post: () => ({ status: 201, body: boardUseCace.resetBoard() }),
}));
