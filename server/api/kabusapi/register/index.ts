import type { DefineMethods } from 'aspida';
import type { m銘柄コード } from 'commonTypesWithClient/branded';
import type { ReqHeaders } from 'commonTypesWithClient/kabusapi';

export type Methods = DefineMethods<{
  put: {
    reqHeaders: ReqHeaders;
    reqBody: { Symbol: m銘柄コード; Exchange: 1 }[];
    resBody: { Symbol: m銘柄コード; Exchange: 1 }[];
  };
}>;
