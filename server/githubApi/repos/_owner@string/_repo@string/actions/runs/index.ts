import type { WorkflowRun } from '$/api/webhooks/github/validator';
import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  get: {
    query: { per_page: number; page: number };
    resBody: { total_count: number; workflow_runs: WorkflowRun[] };
  };
}>;
