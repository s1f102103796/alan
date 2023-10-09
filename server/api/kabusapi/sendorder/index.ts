import type { DefineMethods } from 'aspida';
import type { OrderId, OrderPass, m銘柄コード } from 'commonTypesWithClient/branded';
import type {
  ReqHeaders,
  b売買区分,
  i以上以下,
  s信用区分,
  s信用取引区分,
  s執行条件,
} from 'commonTypesWithClient/kabusapi';

export type Methods = DefineMethods<{
  post: {
    reqHeaders: ReqHeaders;
    reqBody: {
      Password: OrderPass;
      Symbol: m銘柄コード;
      Exchange: 1;
      SecurityType: 1;
      Side: b売買区分;
      CashMargin: s信用区分;
      MarginTradeType: s信用取引区分;
      MarginPremiumUnit: 0;
      DelivType: 2;
      AccountType: 4;
      Qty: number;
      ClosePositionOrder: 0;
      FrontOrderType: s執行条件;
      Price: number;
      ExpireDay: number;
      ReverseLimitOrder?: {
        TriggerSec: 1;
        TriggerPrice: number;
        UnderOver: i以上以下;
        AfterHitOrderType: 1;
        AfterHitPrice: 0;
      };
    };
    resBody: { Result: number; OrderId: OrderId };
  };
}>;
