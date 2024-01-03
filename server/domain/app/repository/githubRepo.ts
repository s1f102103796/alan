import api from '$/api/$api';
import type { WorkflowRun } from '$/api/webhooks/github/validator';
import type { AppModel } from '$/commonTypesWithClient/appModels';
import { parseGHAction, type GHActionModel } from '$/commonTypesWithClient/bubbleModels';
import {
  API_BASE_PATH,
  API_ORIGIN,
  GITHUB_OWNER,
  GITHUB_WEBHOOK_SECRET,
} from '$/service/envValues';
import { githubApiClient } from '$/service/githubApiClient';
import { customAssert } from '$/service/returnStatus';
import aspida from '@aspida/fetch';
import { getApi } from 'ngrok';
import type { GHStepModel } from '../model/githubModels';
import { GH_STEP_TYPES, parseGHStep } from '../model/githubModels';
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
  // eslint-disable-next-line complexity
  findFailedStepOrThrow: async (app: AppModel, ghAction: GHActionModel) => {
    let failedStep: GHStepModel | null = null;
    const perPage = 100;
    let count = 0;
    let page = 0;
    let totalCount = 1;

    while (count < totalCount) {
      page += 1;
      const res = await githubApiClient.repos
        ._owner(GITHUB_OWNER)
        ._repo(app.displayId)
        .actions.runs._workflowId(ghAction.id)
        .jobs.$get({ query: { per_page: perPage, page } })
        .catch(() => null);

      if (res === null) break;

      totalCount = res.total_count;
      count += res.jobs.length;

      const failedJob = res.jobs.filter((job) => job.conclusion === 'failure').at(-1);

      if (failedJob === undefined) continue;

      const step = failedJob.steps.find((step) => step.conclusion === 'failure');
      customAssert(step, 'エラーならロジック修正必須');

      const type = GH_STEP_TYPES.find((t) => t === step.name);

      if (type === undefined) continue;

      const log = await githubApiClient.repos
        ._owner(GITHUB_OWNER)
        ._repo(app.displayId)
        .actions.jobs._jobId(failedJob.id)
        .logs.$get()
        .then((text) => {
          const lines = text.split('\n');
          return lines
            .slice(
              lines.findIndex(
                (line) => line.includes(`npm run ${type}`) === true || line.includes(`npm ${type}`)
              ),
              -14
            )
            .join('\n');
        });

      failedStep = parseGHStep({
        id: failedJob.id,
        type,
        status: failedJob.status,
        conclusion: failedJob.conclusion,
        log,
        createdTime: new Date(failedJob.started_at).getTime(),
        updatedTime: new Date(failedJob.completed_at).getTime(),
      });
    }

    customAssert(failedStep, 'エラーならロジック修正必須');

    return failedStep;
  },
  resetWebhook: async (app: AppModel) => {
    const origin = API_ORIGIN.startsWith('http://localhost')
      ? await getApi()
          ?.listTunnels()
          .then((ts) => ts.tunnels.find((t) => t.proto === 'https')?.public_url)
      : API_ORIGIN;
    customAssert(origin, 'エラーならロジック修正必須');

    const url = api(
      aspida(undefined, { baseURL: `${origin}${API_BASE_PATH}` })
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
            events: ['workflow_run'],
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
