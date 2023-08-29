import type { DefineMethods } from 'aspida';
import type { UserId } from '../../commonTypesWithClient/branded';

export type Methods = DefineMethods<{
  get: {
    resBody: string;
  };
  post: {
    reqBody: {
      id: UserId | undefined;
    };
  };
}>;
