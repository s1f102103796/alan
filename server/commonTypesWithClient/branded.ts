import type { z } from 'zod';

type Branded<T extends string> = string & z.BRAND<T>;

export type Maybe<T> = T | Branded<'Maybe'>;
export type BubbleId = Branded<'BubbleId'>;
export type DisplayId = Branded<'DisplayId'>;
export type AppId = Branded<'AppId'>;
export type UserId = Branded<'UserId'>;
export type CommitId = Branded<'CommitId'>;
export type GitHubId = Branded<'GitHubId'>;
export type GHActionId = Branded<'GHActionId'>;
export type RWDeploymentId = Branded<'RWDeploymentId'>;
