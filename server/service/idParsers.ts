import { CLAUDE_MODEL_IDS } from '$/commonConstantsWithClient';
import { z } from 'zod';
import type {
  AppId,
  BubbleId,
  ChatLogId,
  DisplayId,
  GitHubId,
  JobId,
  UserId,
} from '../commonTypesWithClient/branded';

const createIdParser = <T extends string>() => z.string() as unknown as z.ZodType<T>;

export const jobIdParser = createIdParser<JobId>();
export const bubbleIdParser = createIdParser<BubbleId>();
export const displayIdParser = createIdParser<DisplayId>();
export const chatLogIdParser = createIdParser<ChatLogId>();
export const appIdParser = createIdParser<AppId>();
export const userIdParser = createIdParser<UserId>();
export const githubIdParser = createIdParser<GitHubId>();
export const claudeModelIdParser = z.enum(CLAUDE_MODEL_IDS);
