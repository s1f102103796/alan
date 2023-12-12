import type { DefineMethods } from 'aspida';
import type { AppModel } from 'commonTypesWithClient/appModels';
import type { AppId, Maybe } from 'commonTypesWithClient/branded';

export type Methods = DefineMethods<{
  patch: {
    reqBody: { appId: Maybe<AppId> };
    resBody: AppModel;
  };
}>;
