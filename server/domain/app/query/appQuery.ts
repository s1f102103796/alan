import type { AppModelBase, BubbleModel, WaitingAppModel } from '$/commonTypesWithClient/appModels';
import { APP_STATUSES, BUBBLE_TYPES, type AppModel } from '$/commonTypesWithClient/appModels';
import { appIdParser, bubbleIdParser, displayIdParser, userIdParser } from '$/service/idParsers';
import { customAssert } from '$/service/returnStatus';
import type { App, Bubble, Prisma } from '@prisma/client';
import { z } from 'zod';

const PRISMA_APP_INCLUDE = { bubbles: { orderBy: { index: 'asc' } } } satisfies Prisma.AppInclude;

export const indexToDisplayId = (index: number) => displayIdParser.parse(`deus-${index}`);
export const indexToSubDomain = (index: number) => `d${index}`;

const toAppModelBase = (app: App & { bubbles: Bubble[] }): AppModelBase => ({
  id: appIdParser.parse(app.id),
  userId: userIdParser.parse(app.userId),
  index: app.index,
  displayId: indexToDisplayId(app.index),
  subDomain: indexToSubDomain(app.index),
  name: app.name,
  createdTime: app.createdAt.getTime(),
  statusUpdatedTime: app.statusUpdatedAt.getTime(),
  bubbles: app.bubbles.map(
    (bubble): BubbleModel => ({
      id: bubbleIdParser.parse(bubble.id),
      type: z.enum(BUBBLE_TYPES).parse(bubble.type),
      content: bubble.content,
      createdTime: bubble.createdAt.getTime(),
    })
  ),
});

const toWaitingAppModel = (
  app: App & { bubbles: Bubble[] },
  waitingIds: string[]
): WaitingAppModel => {
  customAssert(app.status !== 'status', 'エラーならロジック修正必須');

  return { ...toAppModelBase(app), status: 'waiting', waitingOrder: waitingIds.indexOf(app.id) };
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
