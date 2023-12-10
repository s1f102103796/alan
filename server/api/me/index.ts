import type { DefineMethods } from 'aspida';
import type { UserModel } from 'commonTypesWithClient/appModels';

export type Methods = DefineMethods<{
  get: {
    resBody: UserModel;
  };
}>;
