import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  post: {
    reqBody: { desc: string };
    resBody: AppModel;
  };
}>;
