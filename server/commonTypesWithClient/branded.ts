import type { z } from 'zod';

type Branded<T extends string> = string & z.BRAND<T>;

export type BubbleId = Branded<'BubbleId'>;
export type DisplayId = Branded<'DisplayId'>;
export type AppId = Branded<'AppId'>;
export type UserId = Branded<'UserId'>;
export type GitHubId = Branded<'GitHubId'>;
