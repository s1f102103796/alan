import type { AppModelBase, WaitingAppModel } from '$/commonTypesWithClient/appModels';
import { APP_STATUSES, type AppModel } from '$/commonTypesWithClient/appModels';
import type { AppId, DisplayId, Maybe } from '$/commonTypesWithClient/branded';
import type { BubbleModel } from '$/commonTypesWithClient/bubbleModels';
import {
  bubbleTypeParser,
  parseGHAction,
  parseRWDeployment,
} from '$/commonTypesWithClient/bubbleModels';
import {
  BASE_DOMAIN,
  DISPLAY_ID_PREFIX,
  GITHUB_OWNER,
  SUB_DOMAIN_PREFIX,
} from '$/service/envValues';
import { appIdParser, bubbleIdParser, displayIdParser, userIdParser } from '$/service/idParsers';
import { customAssert } from '$/service/returnStatus';
import type { App, Bubble, GitHubAction, Prisma, RailwayDeployment } from '@prisma/client';
import { z } from 'zod';

const PRISMA_APP_INCLUDE = {
  bubbles: { include: { GitHubAction: true, RailwayDeployment: true }, orderBy: { index: 'asc' } },
} satisfies Prisma.AppInclude;

export const indexToDisplayId = (index: number) =>
  displayIdParser.parse(`${DISPLAY_ID_PREFIX}-${index}`);
export const indexToUrls = (index: number): AppModel['urls'] => ({
  site: `https://${SUB_DOMAIN_PREFIX}${index}.${BASE_DOMAIN}`,
  github: `https://github.com/${GITHUB_OWNER}/${indexToDisplayId(index)}`,
  vscode: `https://github.dev/${GITHUB_OWNER}/${indexToDisplayId(
    index
  )}/blob/main/client/src/pages/index.page.tsx`,
});

export const projectIdToUrl = (projectId: string) => `https://railway.app/project/${projectId}`;
export const toGHActionUrl = (displayId: DisplayId, actionId: number | string) =>
  `https://github.com/${GITHUB_OWNER}/${displayId}/actions/runs/${actionId}`;
export const toRWDeployUrl = (ids: {
  project: string | null;
  service: string | null;
  deployment: string;
}) => {
  customAssert(ids.project, 'エラーならロジック修正必須');
  customAssert(ids.service, 'エラーならロジック修正必須');

  return `https://railway.app/project/${ids.project}/service/${ids.service}?id=${ids.deployment}`;
};

type PrismaApp = App & {
  bubbles: (Bubble & {
    GitHubAction: GitHubAction | null;
    RailwayDeployment: RailwayDeployment | null;
  })[];
};

const toAppModelBase = (app: PrismaApp): AppModelBase => {
  const displayId = indexToDisplayId(app.index);

  return {
    id: appIdParser.parse(app.id),
    userId: userIdParser.parse(app.userId),
    index: app.index,
    displayId,
    name: app.name,
    createdTime: app.createdAt.getTime(),
    statusUpdatedTime: app.statusUpdatedAt.getTime(),
    githubUpdatedTime: app.railwayUpdatedAt.getTime(),
    railwayUpdatedTime: app.railwayUpdatedAt.getTime(),
    urls: indexToUrls(app.index),
    bubbles: app.bubbles.map((bubble): BubbleModel => {
      const type = bubbleTypeParser.parse(bubble.type);
      const base = { id: bubbleIdParser.parse(bubble.id), createdTime: bubble.createdAt.getTime() };

      switch (type) {
        case 'ai':
        case 'human':
          return { ...base, type, content: bubble.content };
        case 'github':
          customAssert(bubble.GitHubAction, 'エラーならロジック修正必須');

          return {
            ...base,
            type,
            content: parseGHAction({
              id: bubble.GitHubAction.id,
              type: bubble.GitHubAction.type,
              title: bubble.GitHubAction.title,
              status: bubble.GitHubAction.status,
              url: toGHActionUrl(displayId, bubble.GitHubAction.id),
              branch: bubble.GitHubAction.branch,
              commitId: bubble.GitHubAction.commitId,
              createdTime: bubble.GitHubAction.createdAt.getTime(),
              updatedTime: bubble.GitHubAction.updatedAt.getTime(),
            }),
          };
        case 'railway':
          customAssert(bubble.RailwayDeployment, 'エラーならロジック修正必須');

          return {
            ...base,
            type,
            content: parseRWDeployment({
              id: bubble.RailwayDeployment.id,
              title: bubble.RailwayDeployment.title,
              status: bubble.RailwayDeployment.status,
              url: toRWDeployUrl({
                project: app.projectId,
                service: app.serviceId,
                deployment: bubble.RailwayDeployment.id,
              }),
              branch: bubble.RailwayDeployment.branch,
              commitId: bubble.RailwayDeployment.commitId,
              createdTime: bubble.RailwayDeployment.createdAt.getTime(),
              updatedTime: bubble.RailwayDeployment.updatedAt.getTime(),
            }),
          };
        default:
          throw new Error(type satisfies never);
      }
    }),
  };
};

const toWaitingAppModel = (app: PrismaApp, waitingIds: string[]): WaitingAppModel => {
  customAssert(app.status !== 'status', 'エラーならロジック修正必須');

  return {
    ...toAppModelBase(app),
    status: 'waiting',
    waitingOrder: waitingIds.indexOf(app.id) + 1,
  };
};

const toAppModel = (app: PrismaApp, waitingIds: string[]): AppModel => {
  const status = z.enum(APP_STATUSES).parse(app.status);

  if (status === 'waiting') return toWaitingAppModel(app, waitingIds);

  customAssert(app.environmentId !== null, 'エラーならロジック修正必須');
  customAssert(app.projectId !== null, 'エラーならロジック修正必須');
  customAssert(app.serviceId !== null, 'エラーならロジック修正必須');

  return {
    ...toAppModelBase(app),
    status,
    railway: {
      url: projectIdToUrl(app.projectId),
      environmentId: app.environmentId,
      projectId: app.projectId,
      serviceId: app.serviceId,
    },
  };
};

export const appQuery = {
  countAll: (tx: Prisma.TransactionClient) => tx.app.count(),
  countWaitings: (tx: Prisma.TransactionClient) => tx.app.count({ where: { status: 'waiting' } }),
  findAll: (tx: Prisma.TransactionClient) =>
    tx.app.findMany({ include: PRISMA_APP_INCLUDE, orderBy: { index: 'asc' } }).then((apps) => {
      const waitingIds = apps.filter((app) => app.status === 'waiting').map((app) => app.id);
      return apps.map((app) => toAppModel(app, waitingIds));
    }),
  findByIdOrThrow: (tx: Prisma.TransactionClient, id: Maybe<AppId>) =>
    tx.app.findMany({ include: PRISMA_APP_INCLUDE, orderBy: { index: 'asc' } }).then((apps) => {
      const waitingIds = apps.filter((app) => app.status === 'waiting').map((app) => app.id);
      return tx.app
        .findUniqueOrThrow({ where: { id }, include: PRISMA_APP_INCLUDE })
        .then((app) => toAppModel(app, waitingIds));
    }),
  findWaitings: (tx: Prisma.TransactionClient) =>
    tx.app
      .findMany({
        where: { status: 'waiting' },
        include: PRISMA_APP_INCLUDE,
        orderBy: { index: 'asc' },
      })
      .then((apps) => {
        const waitingIds = apps.map((app) => app.id);
        return apps.map((app) => toWaitingAppModel(app, waitingIds));
      }),
  findWaitingHead: (tx: Prisma.TransactionClient) =>
    tx.app
      .findFirst({
        where: { status: 'waiting' },
        include: PRISMA_APP_INCLUDE,
        orderBy: { index: 'asc' },
      })
      .then((app) => (app !== null ? toWaitingAppModel(app, [app.id]) : undefined)),
};
