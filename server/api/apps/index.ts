import type { DefineMethods } from 'aspida';
import type { AppModel } from 'commonTypesWithClient/appModels';

export type Methods = DefineMethods<{
  get: {
    resBody: AppModel[];
  };
  post: {
    reqBody: { desc: string };
    resBody: AppModel;
  };
}>;
