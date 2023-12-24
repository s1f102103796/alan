import type { GHStatus } from '$/commonTypesWithClient/bubbleModels';
import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  get: {
    query: { filter?: 'latest' | 'all'; per_page: number; page: number };
    resBody: {
      total_count: number;
      jobs: {
        id: number;
        run_id: number;
        run_url: string;
        node_id: string;
        head_sha: string;
        url: string;
        html_url: string;
        status: GHStatus;
        conclusion: 'success' | 'failure' | null;
        started_at: string;
        completed_at: string;
        name: string;
        steps: {
          name: string;
          status: GHStatus;
          conclusion: 'success' | 'failure' | null;
          number: number;
          started_at: string;
          completed_at: string;
        }[];
        check_run_url: string;
        labels: string[];
        runner_id: number;
        runner_name: string;
        runner_group_id: number;
        runner_group_name: string;
        workflow_name: string;
        head_branch: string;
      }[];
    };
  };
}>;
