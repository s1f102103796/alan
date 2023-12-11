import type { AppModelBase, BubbleModel, WaitingAppModel } from '$/commonTypesWithClient/appModels';
import { APP_STATUSES, BUBBLE_TYPES, type AppModel } from '$/commonTypesWithClient/appModels';
import {
  BASE_DOMAIN,
  DISPLAY_ID_PREFIX,
  GITHUB_OWNER,
  SUB_DOMAIN_PREFIX,
} from '$/service/envValues';
import { appIdParser, bubbleIdParser, displayIdParser, userIdParser } from '$/service/idParsers';
import { customAssert } from '$/service/returnStatus';
import type { App, Bubble, Prisma } from '@prisma/client';
import { z } from 'zod';

const PRISMA_APP_INCLUDE = { bubbles: { orderBy: { index: 'asc' } } } satisfies Prisma.AppInclude;

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

const toAppModelBase = (app: App & { bubbles: Bubble[] }): AppModelBase => {
  return {
    id: appIdParser.parse(app.id),
    userId: userIdParser.parse(app.userId),
    index: app.index,
    displayId: indexToDisplayId(app.index),
    name: app.name,
    createdTime: app.createdAt.getTime(),
    statusUpdatedTime: app.statusUpdatedAt.getTime(),
    urls: indexToUrls(app.index),
    bubbles: app.bubbles.map(
      (bubble): BubbleModel => ({
        id: bubbleIdParser.parse(bubble.id),
        type: z.enum(BUBBLE_TYPES).parse(bubble.type),
        content: bubble.content,
        createdTime: bubble.createdAt.getTime(),
      })
    ),
  };
};

const toWaitingAppModel = (
  app: App & { bubbles: Bubble[] },
  waitingIds: string[]
): WaitingAppModel => {
  customAssert(app.status !== 'status', 'エラーならロジック修正必須');

  return {
    ...toAppModelBase(app),
    status: 'waiting',
    waitingOrder: waitingIds.indexOf(app.id) + 1,
  };
};

const toAppModel = (app: App & { bubbles: Bubble[] }, waitingIds: string[]): AppModel => {
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
      })
      .then((app) => (app !== null ? toWaitingAppModel(app, [app.id]) : undefined)),
};
