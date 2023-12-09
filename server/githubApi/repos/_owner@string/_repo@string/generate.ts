import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  post: {
    reqBody: { owner: string; name: string; include_all_branches: boolean };
    resBody: { name: string; owner: { login: string } };
  };
}>;
