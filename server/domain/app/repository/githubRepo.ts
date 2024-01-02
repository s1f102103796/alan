import type { ActiveAppModel, AppModel, InitAppModel } from '$/commonTypesWithClient/appModels';
import { parseGHAction, type GHActionModel } from '$/commonTypesWithClient/bubbleModels';
import api from '$/githubApi/$api';
import { GITHUB_OWNER, GITHUB_TEMPLATE, GITHUB_TOKEN } from '$/service/envValues';
import { customAssert } from '$/service/returnStatus';
import aspida from '@aspida/fetch';
import { setInterval, setTimeout } from 'timers/promises';
import { URL } from 'url';
import type { GHStepModel } from '../model/githubModels';
import { GH_STEP_TYPES, parseGHStep } from '../model/githubModels';
import {
  displayIdToApiOrigin,
  indexToUrls,
  toBranchUrl,
  toCommitUrl,
  toGHActionUrl,
} from '../query/utils';

const githubApiClient = api(
  aspida(undefined, { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }, throwHttpErrors: true })
);

let calledApiTimes: number[] = [];

const waitApiCallingLimit = async () => {
  const now = Date.now();
  const todayCalledTimes = calledApiTimes.filter((t) => t > now - 24 * 60 * 60 * 1000);
  calledApiTimes = [...todayCalledTimes, now];

  if (todayCalledTimes.length > 4500) await setTimeout(60_000);
};

export const githubRepo = {
  create: async (app: InitAppModel) => {
    await waitApiCallingLimit();

    const repoName = app.displayId;
    const urls = indexToUrls(app.index);

    await githubApiClient.repos
      ._owner(GITHUB_OWNER)
      ._repo(GITHUB_TEMPLATE)
      .generate.$post({
        body: { owner: GITHUB_OWNER, name: repoName, include_all_branches: true },
      })
      .catch((e) => {
        if (e.response.status !== 422) throw e;
      });

    await Promise.all(
      [
        { name: 'CNAME', value: new URL(urls.site).host },
        { name: 'API_ORIGIN', value: displayIdToApiOrigin(repoName) },
      ].map((body) =>
        githubApiClient.repos._owner(GITHUB_OWNER)._repo(repoName).actions.variables.$post({ body })
      )
    ).catch((e) => {
      if (e.response.status !== 409) throw e;
    });

    await githubApiClient.repos
      ._owner(GITHUB_OWNER)
      ._repo(repoName)
      .$patch({ body: { homepage: urls.site } });

    for (let i = 30; i > 0; i -= 1) {
      const res = await fetch(
        `https://github.com/${GITHUB_OWNER}/${repoName}/blob/main/package.json`
      );
      if (res.status === 200) break;

      await setInterval(1000);
    }
  },
  listActionsAll: async (app: InitAppModel | ActiveAppModel) => {
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
      list.push(
        ...res.workflow_runs.map((run) =>
          parseGHAction({
            id: run.id.toString(),
            type: run.name,
            title: run.display_title,
            status: run.conclusion ?? run.status,
            url: toGHActionUrl(app.displayId, run.id),
            branch: run.head_branch,
            branchUrl: toBranchUrl(app.displayId, run.head_branch),
            commitId: run.head_commit.id,
            commitUrl: toCommitUrl(app.displayId, run.head_commit.id),
            createdTime: new Date(run.created_at).getTime(),
            updatedTime: new Date(run.updated_at).getTime(),
          })
        )
      );
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
        id: failedJob.id.toString(),
        type,
        status: failedJob.conclusion ?? failedJob.status,
        log,
        createdTime: new Date(failedJob.started_at).getTime(),
        updatedTime: new Date(failedJob.completed_at).getTime(),
      });
    }

    customAssert(failedStep, 'エラーならロジック修正必須');

    return failedStep;
  },
};
