import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { DisplayId } from '$/commonTypesWithClient/branded';
import type { BubbleModel } from '$/commonTypesWithClient/bubbleModels';
import { BASE_DOMAIN, DISPLAY_ID_PREFIX, GITHUB_OWNER } from '$/service/envValues';
import { displayIdParser } from '$/service/idParsers';
import { customAssert } from '$/service/returnStatus';

export const indexToDisplayId = (index: number) =>
  displayIdParser.parse(`${DISPLAY_ID_PREFIX}-${index}`);
export const indexToUrls = (index: number): Required<AppModel>['urls'] => ({
  site: `https://${index}.${BASE_DOMAIN}`,
  github: `https://github.com/${GITHUB_OWNER}/${indexToDisplayId(index)}`,
  vscode: `https://github.dev/${GITHUB_OWNER}/${indexToDisplayId(
    index
  )}/blob/main/client/src/pages/index.page.tsx`,
});

export const projectIdToUrl = (projectId: string) => `https://railway.app/project/${projectId}`;
export const toGHActionUrl = (displayId: DisplayId, actionId: number | string) =>
  `https://github.com/${GITHUB_OWNER}/${displayId}/actions/runs/${actionId}`;
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

export const createUrls = (app: { index: number }, bubbles: BubbleModel[]) =>
  bubbles.filter(
    (b) =>
      b.type === 'github' &&
      b.content.type === 'pages build and deployment' &&
      b.content.status === 'success'
  ).length >= 2 && bubbles.some((b) => b.type === 'railway' && b.content.status === 'SUCCESS')
    ? indexToUrls(app.index)
    : undefined;
