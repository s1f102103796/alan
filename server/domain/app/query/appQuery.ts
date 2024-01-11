import type { AppId, DisplayId, Maybe } from '$/commonTypesWithClient/branded';
import type { Prisma } from '@prisma/client';
import { toAppModel, toWaitingAppModel } from './toAppModel';
import { displayIdToIndex } from './utils';

const APP_INCLUDE = {
  User: true,
  bubbles: {
    include: { GitHubAction: true, RailwayDeployment: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.AppInclude;

export const appQuery = {
  countAll: (tx: Prisma.TransactionClient) => tx.app.count(),
  countWaitings: (tx: Prisma.TransactionClient) => tx.app.count({ where: { status: 'waiting' } }),
  findAll: (tx: Prisma.TransactionClient) =>
    tx.app.findMany({ include: APP_INCLUDE, orderBy: { index: 'asc' } }).then((apps) => {
      const waitingIds = apps.filter((app) => app.status === 'waiting').map((app) => app.id);
      return apps.map((app) => toAppModel(app, waitingIds));
    }),
  findByIdOrThrow: (tx: Prisma.TransactionClient, id: Maybe<AppId>) =>
    tx.app.findMany({ include: APP_INCLUDE, orderBy: { index: 'asc' } }).then((apps) => {
      const waitingIds = apps.filter((app) => app.status === 'waiting').map((app) => app.id);
      return tx.app
        .findUniqueOrThrow({ where: { id }, include: APP_INCLUDE })
        .then((app) => toAppModel(app, waitingIds));
    }),
  findByDisplayIdOrThrow: (tx: Prisma.TransactionClient, displayId: DisplayId) =>
    tx.app.findMany({ include: APP_INCLUDE, orderBy: { index: 'asc' } }).then((apps) => {
      const waitingIds = apps.filter((app) => app.status === 'waiting').map((app) => app.id);
      return tx.app
        .findFirstOrThrow({ where: { index: displayIdToIndex(displayId) }, include: APP_INCLUDE })
        .then((app) => toAppModel(app, waitingIds));
    }),
  findWaitings: (tx: Prisma.TransactionClient) =>
    tx.app
      .findMany({ where: { status: 'waiting' }, include: APP_INCLUDE, orderBy: { index: 'asc' } })
      .then((apps) => {
        const waitingIds = apps.map((app) => app.id);
        return apps.map((app) => toWaitingAppModel(app, waitingIds));
      }),
  findWaitingHead: (tx: Prisma.TransactionClient) =>
    tx.app
      .findFirst({ where: { status: 'waiting' }, include: APP_INCLUDE, orderBy: { index: 'asc' } })
      .then((app) => (app !== null ? toWaitingAppModel(app, [app.id]) : undefined)),
};
