import { z } from 'zod';
import type { CommitId, GHActionId, RWDeploymentId } from '../commonTypesWithClient/branded';
import {
  type AppId,
  type BubbleId,
  type DisplayId,
  type GitHubId,
  type UserId,
} from '../commonTypesWithClient/branded';

const createIdParser = <T extends string>() => z.string() as unknown as z.ZodType<T>;

export const bubbleIdParser = createIdParser<BubbleId>();
export const displayIdParser = createIdParser<DisplayId>();
export const appIdParser = createIdParser<AppId>();
export const userIdParser = createIdParser<UserId>();
export const commitIdParser = createIdParser<CommitId>();
export const githubIdParser = createIdParser<GitHubId>();
export const ghActionIdParser = createIdParser<GHActionId>();
export const rwDeploymentIdParser = createIdParser<RWDeploymentId>();
