import { z } from 'zod';
import type { JobId, TaskId, UserId } from '../commonTypesWithClient/branded';

const createIdParser = <T extends string>() => z.string() as unknown as z.ZodType<T>;

export const userIdParser = createIdParser<UserId>();
export const jobIdParser = createIdParser<JobId>();

export const taskIdParser = createIdParser<TaskId>();
