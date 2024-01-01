import type { z } from 'zod';

type Branded<T extends string> = string & z.BRAND<T>;

export type AppEventId = Branded<'AppEventId'>;
