import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  put: {
    reqBody: { enabled: boolean };
  };
}>;
