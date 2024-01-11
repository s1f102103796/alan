import type { DefineMethods } from 'aspida';
import type { AppModel } from 'commonTypesWithClient/appModels';

export type Methods = DefineMethods<{
  post: {
    reqHeaders: { authorization: string };
    reqBody: { name: string; similarName: string };
    resBody: AppModel;
  };
}>;
