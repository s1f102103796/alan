import type { DefineMethods } from 'aspida';
import type { GHWebhookBody, ReqHeaders } from './validator';

export type Methods = DefineMethods<{
  post: {
    reqHeaders: ReqHeaders;
    reqBody: GHWebhookBody;
  };
}>;
