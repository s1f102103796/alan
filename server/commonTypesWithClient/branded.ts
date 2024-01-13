import type { z } from 'zod';

type Branded<T extends string> = string & z.BRAND<T>;
type BrandedNumber<T extends string> = number & z.BRAND<T>;

export type Maybe<T> = T | Branded<'Maybe'>;
export type BubbleId = Branded<'BubbleId'>;
export type DisplayId = Branded<'DisplayId'>;
export type AppId = Branded<'AppId'>;
export type UserId = Branded<'UserId'>;
export type CommitId = Branded<'CommitId'>;
export type GHUserId = Branded<'GHUserId'>;
export type TaskId = Branded<'TaskId'>;
export type GHActionId = BrandedNumber<'GHActionId'>;
export type RWDeploymentId = Branded<'RWDeploymentId'>;
export type GHStepId = BrandedNumber<'GHStepId'>;
export type AppEventId = Branded<'AppEventId'>;
