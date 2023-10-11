import type { JobModel } from '$/commonTypesWithClient/models';
import { jobIdParser } from '$/service/idParsers';
import { randomUUID } from 'crypto';

export const jobMethods = {
  create: (description: string): JobModel => {
    const now = Date.now();

    return {
      id: jobIdParser.parse(randomUUID()),
      status: 'ready',
      description,
      createdTimestamp: now,
    };
  },
};
