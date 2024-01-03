import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  post: {
    reqBody: { url: string };
    resBody: { url: string };
  };
}>;
