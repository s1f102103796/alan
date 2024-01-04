import { z } from 'zod';
import {
  bubbleIdParser,
  commitIdParser,
  ghActionIdParser,
  rwDeploymentIdParser,
} from '../service/idParsers';

export const actionTypeParser = z.enum([
  'test',
  'schema validation',
  'client deployment',
  'pull request test',
  'pages build and deployment',
]);

export const ghStatusParser = z.enum([
  'completed',
  'in_progress',
  'queued',
  'requested',
  'waiting',
  'pending',
]);

export const ghConclusionParser = z
  .enum([
    'success',
    'failure',
    'neutral',
    'cancelled',
    'timed_out',
    'action_required',
    'stale',
    'skipped',
  ])
  .or(z.null());

const ghActionParser = z.object({
  id: ghActionIdParser,
  model: z.literal('github'),
  type: actionTypeParser,
  title: z.string(),
  status: ghStatusParser,
  conclusion: ghConclusionParser,
  url: z.string(),
  branch: z.string(),
  branchUrl: z.string(),
  commitId: commitIdParser,
  commitUrl: z.string(),
  createdTime: z.number(),
  updatedTime: z.number(),
});

export type GHActionType = z.infer<typeof actionTypeParser>;
export type GHStatus = z.infer<typeof ghStatusParser>;
export type GHConclusion = z.infer<typeof ghConclusionParser>;
export type GHActionModel = z.infer<typeof ghActionParser>;

export const parseGHAction = (val: {
  [Key in keyof Omit<GHActionModel, 'model'>]: GHActionModel[Key] extends string
    ? string
    : GHActionModel[Key] extends string | null
    ? string | null
    : number;
}) => ghActionParser.parse({ ...val, model: 'github' });

const RW_STATUSES = [
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
  branchUrl: z.string(),
  commitId: commitIdParser,
  commitUrl: z.string(),
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

const SYSTEM_STATUSES = [
  'first_question',
  'waiting_init',
  'init_infra',
  'completed_github',
  'retry_test',
] as const;

export type SystemStatus = (typeof SYSTEM_STATUSES)[number];
export const systemStatusParser = z.enum(SYSTEM_STATUSES);

export const BUBBLE_TYPES = ['ai', 'human', 'github', 'railway', 'system'] as const;
export const bubbleTypeParser = z.enum(BUBBLE_TYPES);

const systemBubbleParser = z.object({
  id: bubbleIdParser,
  createdTime: z.number(),
  type: z.literal(BUBBLE_TYPES[4]),
  content: systemStatusParser,
});

const bubbleParser = systemBubbleParser.or(
  z
    .object({ id: bubbleIdParser, createdTime: z.number() })
    .and(
      z.union([
        z.object({ type: z.literal(BUBBLE_TYPES[0]), content: z.string() }),
        z.object({ type: z.literal(BUBBLE_TYPES[1]), content: z.string() }),
        z.object({ type: z.literal(BUBBLE_TYPES[2]), content: ghActionParser }),
        z.object({ type: z.literal(BUBBLE_TYPES[3]), content: rwDeploymentParser }),
      ])
    )
);

export type SystemBubbleModel = z.infer<typeof systemBubbleParser>;

export type BubbleModel = z.infer<typeof bubbleParser>;
