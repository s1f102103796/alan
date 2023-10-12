import type { z } from 'zod';

type Branded<T extends string> = string & z.BRAND<T>;

export type UserId = Branded<'UserId'>;
export type JobId = Branded<'JobId'>;
export type DisplayId = Branded<'DisplayId'>;
export type TaskId = Branded<'TaskId'>;
