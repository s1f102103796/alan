import type { DefineMethods } from 'aspida';
import type { OrderId, OrderPass } from 'commonTypesWithClient/branded';
import type { ReqHeaders } from 'commonTypesWithClient/kabusapi';

export type Methods = DefineMethods<{
  put: {
    reqHeaders: ReqHeaders;
    reqBody: { OrderId: OrderId; Password: OrderPass };
    resBody: { Result: number; OrderId: OrderId };
  };
}>;
