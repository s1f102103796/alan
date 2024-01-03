import type { DefineMethods } from 'aspida';

type Webhook = {
  id: number;
  active: boolean;
  events: string[];
  config: { url: string };
};

export type Methods = DefineMethods<{
  get: {
    resBody: Webhook[];
  };
  post: {
    reqBody: {
      config: { url: string; content_type: 'json'; secret: string };
      events: ['workflow_run'];
      active: boolean;
    };
    resBody: Webhook;
  };
}>;
