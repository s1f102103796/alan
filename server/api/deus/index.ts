import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  post: {
    reqHeaders: { authorization: string };
    reqBody: { name: string; similarName: string };
    resBody: AppModel;
  };
}>;
