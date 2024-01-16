import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { AppId, Maybe } from '$/commonTypesWithClient/branded';
import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  get: {
    resBody: AppModel[];
  };
  post: {
    reqBody: { name: string; similarName: string };
    resBody: AppModel;
  };
  patch: {
    reqBody: { appId: Maybe<AppId>; content: string };
    resBody: AppModel;
  };
}>;
