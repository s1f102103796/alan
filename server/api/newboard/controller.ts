// import { boardUsecace2 } from '../../useCase/boardUsecase2';
// import { defineController } from './$relay';

// export default defineController(() => ({
//   get: () => ({ status: 200, body: boardUsecace2.getBoard() }),
//   post: () => ({ status: 201, body: boardUsecace2.stopBoard() }),
// }));

import { boardUseCace } from '$/useCase/boardUseCase';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () => ({ status: 200, body: boardUseCace.getBoard() }),
  post: () => ({ status: 201, body: boardUseCace.resetBoard() }),
}));
