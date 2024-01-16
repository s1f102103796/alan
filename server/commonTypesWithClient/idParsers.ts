import { z } from 'zod';
import type {
  AppEventId,
  AppId,
  BubbleId,
  CommitId,
  DisplayId,
  GHActionId,
  GHStepId,
  GHUserId,
  RWDeploymentId,
  TaskId,
  UserId,
} from './branded';

const createIdParser = <T extends string>() => z.string() as unknown as z.ZodType<T>;
const createNumberIdParser = <T extends number>() => z.number() as unknown as z.ZodType<T>;

export const bubbleIdParser = createIdParser<BubbleId>();
export const displayIdParser = createIdParser<DisplayId>();
export const appIdParser = createIdParser<AppId>();
export const userIdParser = createIdParser<UserId>();
export const commitIdParser = createIdParser<CommitId>();
export const ghUserIdParser = createIdParser<GHUserId>();
export const taskIdParser = createIdParser<TaskId>();
export const ghActionIdParser = createNumberIdParser<GHActionId>();
export const rwDeploymentIdParser = createIdParser<RWDeploymentId>();
export const ghStepIdParser = createNumberIdParser<GHStepId>();
export const appEventIdParser = createIdParser<AppEventId>();
