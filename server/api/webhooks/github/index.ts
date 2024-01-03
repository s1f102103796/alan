import type { DefineMethods } from 'aspida';
import type { ReqBody, ReqHeaders } from './validator';

export type Methods = DefineMethods<{
  post: {
    reqHeaders: ReqHeaders;
    reqBody: ReqBody;
  };
}>;
