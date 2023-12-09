import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  post: {
    reqBody: { name: string; default_branch_only: boolean };
    resBody: { name: string; owner: { login: string } };
  };
}>;
