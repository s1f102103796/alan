import type { WaitingAppModel } from '$/commonTypesWithClient/appModels';
import api from '$/githubApi/$api';
import { GITHUB_OWNER, GITHUB_TEMPLATE, GITHUB_TOKEN } from '$/service/envValues';
import aspida from '@aspida/fetch';
import * as GitHubApiCreateCommit from '@himenon/github-api-create-commit';
import { URL } from 'url';

const githubApiClient = api(
  aspida(undefined, { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } })
);

export const githubRepo = {
  create: async (app: WaitingAppModel) => {
    const repoName = app.displayId;
    const commitClient = GitHubApiCreateCommit.create({
      owner: GITHUB_OWNER,
      repo: repoName,
      accessToken: GITHUB_TOKEN,
    });

    await githubApiClient.repos
      ._owner(GITHUB_OWNER)
      ._repo(GITHUB_TEMPLATE)
      .generate.$post({ body: { owner: GITHUB_OWNER, name: repoName, include_all_branches: true } })
      .catch((e) => console.log('ignore error when creating repo:', e.message));

    await Promise.all([
      githubApiClient.repos
        ._owner(GITHUB_OWNER)
        ._repo(repoName)
        .actions.variables.$post({
          body: { name: 'API_ORIGIN', value: `https://${repoName}-production.up.railway.app` },
        }),
      githubApiClient.repos
        ._owner(GITHUB_OWNER)
        ._repo(repoName)
        .$patch({ body: { homepage: app.urls.site } }),
      commitClient.createGitCommit({
        headBranchName: 'main',
        commitMessage: 'feat: add CNAME file',
        files: [{ path: 'client/public/CNAME', content: new URL(app.urls.site).host }],
      }),
      githubApiClient.repos
        ._owner(GITHUB_OWNER)
        ._repo(repoName)
        .pages.$post({ body: { build_type: 'legacy', source: { branch: 'gh-pages' } } }),
    ]);
  },
};
