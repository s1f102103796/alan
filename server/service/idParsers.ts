import { z } from 'zod';
import type {
  AppId,
  BubbleId,
  CommitId,
  DisplayId,
  GHActionId,
  GHStepId,
  GHUserId,
  RWDeploymentId,
  UserId,
} from '../commonTypesWithClient/branded';
import type { AppEventId } from './branded';

const createIdParser = <T extends string>() => z.string() as unknown as z.ZodType<T>;
const createNumberIdParser = <T extends number>() => z.number() as unknown as z.ZodType<T>;

export const bubbleIdParser = createIdParser<BubbleId>();
export const displayIdParser = createIdParser<DisplayId>();
export const appIdParser = createIdParser<AppId>();
export const userIdParser = createIdParser<UserId>();
export const commitIdParser = createIdParser<CommitId>();
export const ghUserIdParser = createIdParser<GHUserId>();
export const ghActionIdParser = createNumberIdParser<GHActionId>();
export const rwDeploymentIdParser = createIdParser<RWDeploymentId>();
export const ghStepIdParser = createNumberIdParser<GHStepId>();
export const appEventIdParser = createIdParser<AppEventId>();
