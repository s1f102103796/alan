import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  get: {
    resBody: AppModel[];
  };
}>;
