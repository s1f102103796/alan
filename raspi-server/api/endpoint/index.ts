import type { UserId } from '$/commonTypesWithClient/branded';
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
