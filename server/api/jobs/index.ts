import type { JobModel } from '$/commonTypesWithClient/models';
import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  get: {
    resBody: JobModel[];
  };
  post: {
    reqBody: { description: string };
    resBody: JobModel;
  };
}>;
