import type { UserModel } from '$/commonTypesWithClient/appModels';
import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  post: {
    resBody: UserModel;
  };
}>;
