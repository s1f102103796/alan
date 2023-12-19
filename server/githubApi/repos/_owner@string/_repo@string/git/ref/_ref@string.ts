import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  get: {
    resBody: {
      ref: string;
      node_id: string;
      url: string;
      object: { type: 'commit'; sha: string; url: string };
    };
  };
}>;
