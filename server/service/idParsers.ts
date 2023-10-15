import { CLAUDE_MODEL_IDS } from '$/commonConstantsWithClient';
import { z } from 'zod';
import type { ChatLogId, DisplayId, JobId } from '../commonTypesWithClient/branded';

const createIdParser = <T extends string>() => z.string() as unknown as z.ZodType<T>;

export const jobIdParser = createIdParser<JobId>();
export const displayIdParser = createIdParser<DisplayId>();
export const chatLogIdParser = createIdParser<ChatLogId>();
export const claudeModelIdParser = z.enum(CLAUDE_MODEL_IDS);
