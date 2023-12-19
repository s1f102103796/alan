import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  post: {
    reqBody: { ref: string; sha: string };
    resBody: {
      ref: string;
      node_id: string;
      url: string;
      object: { type: 'commit'; sha: string; url: string };
    };
  };
}>;
