import { z } from 'zod';
import {
  bubbleIdParser,
  commitIdParser,
  ghActionIdParser,
  rwDeploymentIdParser,
} from '../service/idParsers';

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

const ghActionParser = z.object({
  id: ghActionIdParser,
  model: z.literal('github'),
  type: z.enum(GH_ACTION_TYPES),
  title: z.string(),
  status: z.enum(GH_STATUSES),
  url: z.string(),
  branch: z.string(),
  commitId: commitIdParser,
  createdTime: z.number(),
  updatedTime: z.number(),
});

export type GHActionType = (typeof GH_ACTION_TYPES)[number];

export type GHStatus = (typeof GH_STATUSES)[number];

export type GHActionModel = z.infer<typeof ghActionParser>;

export const parseGHAction = (val: {
  [Key in keyof Omit<GHActionModel, 'model'>]: GHActionModel[Key] extends string ? string : number;
}) => ghActionParser.parse({ ...val, model: 'github' });

export const RW_STATUSES = [
  'BUILDING',
  'CRASHED',
  'DEPLOYING',
  'FAILED',
  'INITIALIZING',
  'QUEUED',
  'REMOVED',
  'REMOVING',
  'SKIPPED',
  'SUCCESS',
  'WAITING',
] as const;

const rwDeploymentParser = z.object({
  id: rwDeploymentIdParser,
  model: z.literal('railway'),
  title: z.string(),
  status: z.enum(RW_STATUSES),
  url: z.string(),
  branch: z.string(),
  commitId: commitIdParser,
  createdTime: z.number(),
  updatedTime: z.number(),
});

export type RWStatus = (typeof RW_STATUSES)[number];

export type RWDeploymentModel = z.infer<typeof rwDeploymentParser>;

export const parseRWDeployment = (val: {
  [Key in keyof Omit<RWDeploymentModel, 'model'>]: RWDeploymentModel[Key] extends string
    ? string
    : number;
}) => rwDeploymentParser.parse({ ...val, model: 'railway' });

export const BUBBLE_TYPES = ['ai', 'human', 'github', 'railway'] as const;
export const bubbleTypeParser = z.enum(BUBBLE_TYPES);

const bubbleParser = z
  .object({ id: bubbleIdParser, createdTime: z.number() })
  .and(
    z.union([
      z.object({ type: z.literal(BUBBLE_TYPES[0]), content: z.string() }),
      z.object({ type: z.literal(BUBBLE_TYPES[1]), content: z.string() }),
      z.object({ type: z.literal(BUBBLE_TYPES[2]), content: ghActionParser }),
      z.object({ type: z.literal(BUBBLE_TYPES[3]), content: rwDeploymentParser }),
    ])
  );

export type BubbleModel = z.infer<typeof bubbleParser>;
