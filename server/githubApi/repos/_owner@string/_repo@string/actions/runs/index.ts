import type { CommitId } from '$/commonTypesWithClient/branded';
import type { GHActionType, GHStatus } from '$/commonTypesWithClient/bubbleModels';
import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  get: {
    query: { per_page: number; page: number };
    resBody: {
      total_count: number;
      workflow_runs: {
        id: number;
        name: GHActionType;
        node_id: string;
        check_suite_id: number;
        check_suite_node_id: string;
        head_branch: string;
        head_sha: string;
        path: string;
        run_number: number;
        event: 'push' | 'pull_request' | 'workflow_run' | 'dynamic';
        display_title: string;
        status: GHStatus;
        conclusion: 'success' | 'failure' | null;
        workflow_id: number;
        url: string;
        html_url: string;
        pull_requests: [];
        created_at: string;
        updated_at: string;
        run_attempt: number;
        run_started_at: string;
        jobs_url: string;
        logs_url: string;
        check_suite_url: string;
        artifacts_url: string;
        cancel_url: string;
        rerun_url: string;
        workflow_url: string;
        head_commit: {
          id: CommitId;
          tree_id: string;
          message: string;
          timestamp: string;
          author: { name: string; email: string };
          committer: { name: string; email: string };
        };
      }[];
    };
  };
}>;
