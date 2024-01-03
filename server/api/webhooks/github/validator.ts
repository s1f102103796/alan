import { z } from 'zod';
import {
  actionTypeParser,
  ghConclusionParser,
  ghStatusParser,
} from '../../../commonTypesWithClient/bubbleModels';
import { GITHUB_OWNER } from '../../../service/envValues';
import { displayIdParser, ghActionIdParser } from '../../../service/idParsers';

export const headersValidator = z
  .object({ 'x-hub-signature-256': z.string(), 'x-github-event': z.enum(['ping', 'workflow_run']) })
  .passthrough();

export type ReqHeaders = z.infer<typeof headersValidator>;

const workflowRunValidator = z
  .object({
    id: ghActionIdParser,
    name: actionTypeParser,
    display_title: z.string(),
    conclusion: ghConclusionParser,
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    event: z.enum(['push', 'pull_request', 'workflow_run', 'dynamic']),
    head_branch: z.string(),
    head_commit: z.object({ id: z.string(), message: z.string() }).passthrough(),
    status: ghStatusParser,
  })
  .passthrough();

export const bodyValidator = z.union([
  z.object({ workflow_run: z.undefined() }).passthrough(),
  z
    .object({
      name: z.string(),
      action: ghStatusParser,
      repository: z.object({
        name: displayIdParser,
        owner: z.object({ login: z.literal(GITHUB_OWNER) }),
      }),
      workflow_run: workflowRunValidator,
    })
    .passthrough(),
]);

export type ReqBody = z.infer<typeof bodyValidator>;

export type WorkflowRun = z.infer<typeof workflowRunValidator>;
