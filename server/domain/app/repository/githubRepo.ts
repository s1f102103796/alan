import api from '$/api/$api';
import type { WorkflowRun } from '$/api/webhooks/github/validator';
import type { AppModel } from '$/commonTypesWithClient/appModels';
import { parseGHAction, type GHActionModel } from '$/commonTypesWithClient/bubbleModels';
import { API_BASE_PATH, GITHUB_OWNER, GITHUB_WEBHOOK_SECRET } from '$/service/envValues';
import { githubApiClient } from '$/service/githubApiClient';
import { getApiOriginOrLocaltunnelUrl } from '$/service/localtunnel';
import aspida from '@aspida/fetch';
import { toBranchUrl, toCommitUrl, toGHActionUrl } from '../query/utils';

export const githubRepo = {
  workflowRunToModel: (app: AppModel, workflowRun: WorkflowRun) =>
    parseGHAction({
      id: workflowRun.id,
      type: workflowRun.name,
      title: workflowRun.display_title,
      status: workflowRun.status,
      conclusion: workflowRun.conclusion,
      url: toGHActionUrl(app.displayId, workflowRun.id),
      branch: workflowRun.head_branch,
      branchUrl: toBranchUrl(app.displayId, workflowRun.head_branch),
      commitId: workflowRun.head_commit.id,
      commitUrl: toCommitUrl(app.displayId, workflowRun.head_commit.id),
      createdTime: new Date(workflowRun.created_at).getTime(),
      updatedTime: new Date(workflowRun.updated_at).getTime(),
    }),
  listActionsAll: async (app: AppModel) => {
    const list: GHActionModel[] = [];
    const perPage = 100;
    let page = 0;
    let totalCount = 1;

    while (list.length < totalCount) {
      page += 1;
      const res = await githubApiClient.repos
        ._owner(GITHUB_OWNER)
        ._repo(app.displayId)
        .actions.runs.$get({ query: { per_page: perPage, page } })
        .catch(() => null);

      if (res === null) break;

      totalCount = res.total_count;
      list.push(...res.workflow_runs.map((run) => githubRepo.workflowRunToModel(app, run)));
    }

    return list;
  },
  resetWebhook: async (app: AppModel) => {
    const url = api(
      aspida(undefined, { baseURL: `${getApiOriginOrLocaltunnelUrl()}${API_BASE_PATH}` })
    ).webhooks.github.$path();

    const [oldHook] = await githubApiClient.repos
      ._owner(GITHUB_OWNER)
      ._repo(app.displayId)
      .hooks.$get();

    if (oldHook === undefined) {
      return await githubApiClient.repos
        ._owner(GITHUB_OWNER)
        ._repo(app.displayId)
        .hooks.$post({
          body: {
            config: { url, content_type: 'json', secret: GITHUB_WEBHOOK_SECRET },
            active: true,
            events: ['workflow_run', 'push'],
          },
        });
    }

    if (oldHook.config.url === url) return;

    await githubApiClient.repos
      ._owner(GITHUB_OWNER)
      ._repo(app.displayId)
      .hooks._hookId(oldHook.id)
      .config.$post({ body: { url } });
  },
};
