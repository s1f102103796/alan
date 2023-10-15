import type { z } from 'zod';

type Branded<T extends string> = string & z.BRAND<T>;

export type JobId = Branded<'JobId'>;
export type DisplayId = Branded<'DisplayId'>;
export type ChatLogId = Branded<'ChatLogId'>;
