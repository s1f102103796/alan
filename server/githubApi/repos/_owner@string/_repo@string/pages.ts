import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  post: {
    reqBody: { build_type: 'legacy' | 'workflow'; source: { branch: string } };
  };
}>;
