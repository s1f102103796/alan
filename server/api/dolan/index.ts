import type { DefineMethods } from 'aspida';
import type { DolanModel } from '../../commonTypesWithClient/models';

export type Methods = DefineMethods<{
  get: {
    resBody: string;
  };
  post: {
    reqBody: {
      id: string;
    };
    resBody: DolanModel[];
  };
}>;
