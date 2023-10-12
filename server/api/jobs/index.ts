import type { DefineMethods } from 'aspida';
import type { ProdJobModel, TestJobModel } from 'commonTypesWithClient/models';

export type Methods = DefineMethods<{
  get: {
    resBody: { prod: ProdJobModel | null; tests: TestJobModel[] };
  };
}>;
