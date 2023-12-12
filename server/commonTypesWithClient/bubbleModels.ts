import { z } from 'zod';
import { bubbleIdParser, ghActionIdParser } from '../service/idParsers';

export const GH_ACTION_TYPES = ['Test', 'Deploy client', 'pages build and deployment'] as const;
export const GH_STATUSES = [
  'completed',
  'action_required',
  'cancelled',
  'failure',
  'neutral',
  'skipped',
  'stale',
  'success',
  'timed_out',
  'in_progress',
  'queued',
  'requested',
  'waiting',
  'pending',
] as const;

export const ghActionParser = z.object({
  id: ghActionIdParser,
  type: z.enum(GH_ACTION_TYPES),
  title: z.string(),
  status: z.enum(GH_STATUSES),
  url: z.string(),
  createdTime: z.number(),
  updatedTime: z.number()
});

export type GHActionType = (typeof GH_ACTION_TYPES)[number];

export type GHStatus = (typeof GH_STATUSES)[number];

export type GHActionModel = z.infer<typeof ghActionParser>;

export const BUBBLE_TYPES = ['ai', 'human', 'github'] as const;
export const bubbleTypeParser = z.enum(BUBBLE_TYPES);

export const bubbleParser = z
  .object({ id: bubbleIdParser, createdTime: z.number() })
  .and(
    z.union([
      z.object({ type: z.literal(BUBBLE_TYPES[0]), content: z.string() }),
      z.object({ type: z.literal(BUBBLE_TYPES[1]), content: z.string() }),
      z.object({ type: z.literal(BUBBLE_TYPES[2]), content: ghActionParser }),
    ])
  );

export type BubbleModel = z.infer<typeof bubbleParser>;
