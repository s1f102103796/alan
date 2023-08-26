// import { boardUsecacc  } from '$/useCase/boardUsecase';
// import { defineController } from '../$relay';

// export default defineController(() => ({
//   get: () => ({ status: 200, body: boardUsecace.getBoard() }),
//   post: () => ({ status: 201, body: boardUsecace2.startBoard() }),
// }));

import { boardUseCace } from '$/useCase/boardUseCase';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () => ({ status: 200, body: boardUseCace.getBoard() }),
  post: ({ body, user }) => ({ status: 201, body: boardUseCace.clickBoard(body, user.id) }),
}));
