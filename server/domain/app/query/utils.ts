import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { DisplayId } from '$/commonTypesWithClient/branded';
import { BASE_DOMAIN, DISPLAY_ID_PREFIX, GITHUB_OWNER } from '$/service/envValues';
import { displayIdParser } from '$/service/idParsers';
import { customAssert } from '$/service/returnStatus';

export const indexToDisplayId = (index: number) =>
  displayIdParser.parse(`${DISPLAY_ID_PREFIX}-${index}`);
export const displayIdToIndex = (displayId: DisplayId) => {
  const idxText = displayId.split('-').at(-1);
  customAssert(idxText !== undefined, 'エラーならロジック修正必須');
  return +idxText;
};
export const indexToUrls = (index: number): Required<AppModel>['urls'] => ({
  site: `https://${index}.${BASE_DOMAIN}`,
  github: `https://github.com/${GITHUB_OWNER}/${indexToDisplayId(index)}`,
  vscode: `https://github.dev/${GITHUB_OWNER}/${indexToDisplayId(
    index
  )}/blob/main/client/src/pages/index.page.tsx`,
});

export const projectIdToUrl = (projectId: string) => `https://railway.app/project/${projectId}`;
export const displayIdToApiOrigin = (displayId: DisplayId) =>
  `https://${displayId}-production.up.railway.app`;
export const toGHActionUrl = (displayId: DisplayId, actionId: number | string) =>
  `https://github.com/${GITHUB_OWNER}/${displayId}/actions/runs/${actionId}`;
export const toBranchUrl = (displayId: DisplayId, branch: string) =>
  `https://github.com/${GITHUB_OWNER}/${displayId}/tree/${branch}`;
export const toCommitUrl = (displayId: DisplayId, commitId: string) =>
  `https://github.com/${GITHUB_OWNER}/${displayId}/commit/${commitId}`;
export const toRWDeployUrl = (ids: {
  project: string | null;
  service: string | null;
  deployment: string;
}) => {
  customAssert(ids.project, 'エラーならロジック修正必須');
  customAssert(ids.service, 'エラーならロジック修正必須');

  return `https://railway.app/project/${ids.project}/service/${ids.service}?id=${ids.deployment}`;
};
