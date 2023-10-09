import type { DefineMethods } from 'aspida';
import type { ReqHeaders } from 'commonTypesWithClient/kabusapi';

export type Methods = DefineMethods<{
  get: {
    reqHeaders: ReqHeaders;
    resBody: { MarginAccountWallet: number };
  };
}>;
