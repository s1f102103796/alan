import type { DefineMethods } from 'aspida';
import type { Token } from 'commonTypesWithClient/branded';

export type Methods = DefineMethods<{
  post: {
    reqBody: { APIPassword: string };
    resBody: { ResultCode: number; Token: Token };
  };
}>;
