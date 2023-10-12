import { z } from 'zod';
import type { DisplayId, JobId, TaskId, UserId } from '../commonTypesWithClient/branded';

const createIdParser = <T extends string>() => z.string() as unknown as z.ZodType<T>;

export const userIdParser = createIdParser<UserId>();
export const jobIdParser = createIdParser<JobId>();
export const displayIdParser = createIdParser<DisplayId>();

export const taskIdParser = createIdParser<TaskId>();
