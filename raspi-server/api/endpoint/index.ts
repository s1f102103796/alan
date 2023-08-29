import type { UserId } from '$/commonTypesClient/branded';
import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  get: {
    resBody: string;
  };
  post: {
    reqBody: { id: UserId | undefined };
    resBody: unknown;
  };
}>;
