import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  patch: {
    reqBody: { homepage: string; default_branch: string };
  };
}>;
