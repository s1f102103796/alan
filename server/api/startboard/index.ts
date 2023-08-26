import type { BoardArr } from '../../useCase/boardUseCase';
import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  get: {
    resBody: string;
  };
  post: {
    reqBody: { board: number[][] };
    resBody: BoardArr;
  };
}>;
