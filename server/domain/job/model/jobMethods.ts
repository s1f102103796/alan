import type { CreateJobParams, ProdJobModel, TestJobModel } from '$/commonTypesWithClient/models';
import { displayIdParser, jobIdParser } from '$/service/idParsers';
import { randomUUID } from 'crypto';

export const jobMethods = {
  create: (
    params: CreateJobParams,
    prodJob: ProdJobModel | null,
    testJobs: TestJobModel[]
  ): TestJobModel => ({
    ...params,
    id: jobIdParser.parse(randomUUID()),
    displayId: displayIdParser.parse((testJobs.length + (prodJob === null ? 0 : 1)).toString()),
    status: 'ready',
    mode: 'test',
    createdTimestamp: Date.now(),
  }),
};
