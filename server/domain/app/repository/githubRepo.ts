import type { WaitingAppModel } from '$/commonTypesWithClient/appModels';
import api from '$/githubApi/$api';
import { GITHUB_OWNER, GITHUB_TEMPLATE, GITHUB_TOKEN } from '$/service/envValues';
import aspida from '@aspida/fetch';

const githubApiClient = api(
  aspida(undefined, { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } })
);

export const githubRepo = {
  create: async (app: WaitingAppModel) => {
    const repoName = app.displayId;

    await githubApiClient.repos
      ._owner(GITHUB_OWNER)
      ._repo(GITHUB_TEMPLATE)
      .generate.$post({ body: { owner: GITHUB_OWNER, name: repoName, include_all_branches: true } })
      .catch((e) => console.log('ignore error when creating repo:', e.message));

    await githubApiClient.repos
      ._owner(GITHUB_OWNER)
      ._repo(repoName)
      .actions.variables.$post({
        body: { name: 'API_ORIGIN', value: `https://${repoName}-production.up.railway.app` },
      });

    await githubApiClient.repos
      ._owner(GITHUB_OWNER)
      ._repo(repoName)
      .pages.$post({ body: { build_type: 'legacy', source: { branch: 'gh-pages' } } });
  },
};
