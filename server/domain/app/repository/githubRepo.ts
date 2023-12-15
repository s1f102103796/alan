import type { ActiveAppModel, WaitingAppModel } from '$/commonTypesWithClient/appModels';
import { parseGHAction, type GHActionModel } from '$/commonTypesWithClient/bubbleModels';
import api from '$/githubApi/$api';
import { GITHUB_OWNER, GITHUB_TEMPLATE, GITHUB_TOKEN } from '$/service/envValues';
import aspida from '@aspida/fetch';
// import * as GitHubApiCreateCommit from '@himenon/github-api-create-commit';
import { URL } from 'url';
import { indexToUrls, toCommitUrl, toGHActionUrl } from '../query/utils';

const githubApiClient = api(
  aspida(undefined, { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } })
);

// const commitClient = GitHubApiCreateCommit.create({
//   owner: GITHUB_OWNER,
//   repo: repoName,
//   accessToken: GITHUB_TOKEN,
// });

export const githubRepo = {
  create: async (app: WaitingAppModel) => {
    const repoName = app.displayId;
    const urls = indexToUrls(app.index);

    await githubApiClient.repos
      ._owner(GITHUB_OWNER)
      ._repo(GITHUB_TEMPLATE)
      .generate.$post({ body: { owner: GITHUB_OWNER, name: repoName, include_all_branches: true } })
      .catch((e) => console.log('ignore error when creating repo:', e.message));

    await Promise.all([
      ...[
        { name: 'CNAME', value: new URL(urls.site).host },
        { name: 'API_ORIGIN', value: `https://${repoName}-production.up.railway.app` },
      ].map((body) =>
        githubApiClient.repos._owner(GITHUB_OWNER)._repo(repoName).actions.variables.$post({ body })
      ),
      githubApiClient.repos
        ._owner(GITHUB_OWNER)
        ._repo(repoName)
        .$patch({ body: { homepage: urls.site } }),
      githubApiClient.repos
        ._owner(GITHUB_OWNER)
        ._repo(repoName)
        .pages.$post({ body: { build_type: 'legacy', source: { branch: 'gh-pages' } } }),
    ]);
  },
  listActionsAll: async (app: ActiveAppModel) => {
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
};
