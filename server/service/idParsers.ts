import { z } from 'zod';
import type {
  AppId,
  BubbleId,
  DisplayId,
  GitHubId,
  UserId,
} from '../commonTypesWithClient/branded';

const createIdParser = <T extends string>() => z.string() as unknown as z.ZodType<T>;

export const bubbleIdParser = createIdParser<BubbleId>();
export const displayIdParser = createIdParser<DisplayId>();
export const appIdParser = createIdParser<AppId>();
export const userIdParser = createIdParser<UserId>();
export const githubIdParser = createIdParser<GitHubId>();
