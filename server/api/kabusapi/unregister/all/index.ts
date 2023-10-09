import type { DefineMethods } from 'aspida';
import type { ReqHeaders } from 'commonTypesWithClient/kabusapi';

export type Methods = DefineMethods<{
  put: { reqHeaders: ReqHeaders };
}>;
