import type { AppModelBase, WaitingAppModel } from '$/commonTypesWithClient/appModels';
import { APP_STATUSES, type AppModel } from '$/commonTypesWithClient/appModels';
import type { AppId, DisplayId, Maybe } from '$/commonTypesWithClient/branded';
import type { BubbleModel } from '$/commonTypesWithClient/bubbleModels';
import {
  bubbleTypeParser,
  parseGHAction,
  parseRWDeployment,
  systemStatusParser,
} from '$/commonTypesWithClient/bubbleModels';
import { appIdParser, bubbleIdParser, userIdParser } from '$/service/idParsers';
import { customAssert } from '$/service/returnStatus';
import type { App, Bubble, GitHubAction, Prisma, RailwayDeployment, User } from '@prisma/client';
import { z } from 'zod';
import {
  displayIdToIndex,
  indexToDisplayId,
  indexToUrls,
  projectIdToUrl,
  toBranchUrl,
  toCommitUrl,
  toGHActionUrl,
  toRWDeployUrl,
} from './utils';

const APP_INCLUDE = {
  User: true,
  bubbles: {
    include: { GitHubAction: true, RailwayDeployment: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.AppInclude;

type PrismaBubble = Bubble & {
  GitHubAction: GitHubAction | null;
  RailwayDeployment: RailwayDeployment | null;
};

type PrismaApp = App & { User: User; bubbles: PrismaBubble[] };

// eslint-disable-next-line complexity
const toBubble = (
  app: { index: number; projectId: string | null; serviceId: string | null },
  bubble: PrismaBubble
): BubbleModel => {
  const type = bubbleTypeParser.parse(bubble.type);
  const base = { id: bubbleIdParser.parse(bubble.id), createdTime: bubble.createdAt.getTime() };

  switch (type) {
    case 'ai':
    case 'human':
      return { ...base, type, content: bubble.content };
    case 'system':
      return { ...base, type, content: systemStatusParser.parse(bubble.content) };
    case 'github':
      customAssert(bubble.GitHubAction, 'エラーならロジック修正必須');

      return {
        ...base,
        type,
        content: parseGHAction({
          id: +bubble.GitHubAction.id,
          type: bubble.GitHubAction.type,
          title: bubble.GitHubAction.title,
          status: bubble.GitHubAction.status,
          conclusion: bubble.GitHubAction.conclusion,
          url: toGHActionUrl(indexToDisplayId(app.index), bubble.GitHubAction.id),
          branch: bubble.GitHubAction.branch,
          branchUrl: toBranchUrl(indexToDisplayId(app.index), bubble.GitHubAction.branch),
          commitId: bubble.GitHubAction.commitId,
          commitUrl: toCommitUrl(indexToDisplayId(app.index), bubble.GitHubAction.commitId),
          createdTime: bubble.createdAt.getTime(),
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
          branchUrl: toBranchUrl(indexToDisplayId(app.index), bubble.RailwayDeployment.branch),
          commitId: bubble.RailwayDeployment.commitId,
          commitUrl: toCommitUrl(indexToDisplayId(app.index), bubble.RailwayDeployment.commitId),
          createdTime: bubble.createdAt.getTime(),
          updatedTime: bubble.RailwayDeployment.updatedAt.getTime(),
        }),
      };
    default:
      throw new Error(type satisfies never);
  }
};

const toAppModelBase = (app: PrismaApp): AppModelBase => {
  const bubbles = app.bubbles.map((bubble) => toBubble(app, bubble));

  return {
    id: appIdParser.parse(app.id),
    author: {
      userId: userIdParser.parse(app.userId),
      githubId: app.User.githubId,
      name: app.User.displayName ?? app.User.githubId,
      photoURL: app.User.photoURL ?? undefined,
    },
    index: app.index,
    displayId: indexToDisplayId(app.index),
    name: app.name,
    createdTime: app.createdAt.getTime(),
    bubbles,
  };
};

const toWaitingAppModel = (app: PrismaApp, waitingIds: string[]): WaitingAppModel => {
  return {
    ...toAppModelBase(app),
    status: 'waiting',
    waitingOrder: waitingIds.indexOf(app.id) + 1,
  };
};

const toAppModel = (app: PrismaApp, waitingIds: string[]): AppModel => {
  const status = z.enum(APP_STATUSES).parse(app.status);

  if (status === 'waiting') return toWaitingAppModel(app, waitingIds);
  if (status === 'init') return { ...toAppModelBase(app), status: 'init' };

  customAssert(app.environmentId !== null, 'エラーならロジック修正必須');
  customAssert(app.projectId !== null, 'エラーならロジック修正必須');
  customAssert(app.serviceId !== null, 'エラーならロジック修正必須');

  const base = toAppModelBase(app);

  return {
    ...base,
    status,
    urls:
      base.bubbles.filter(
        (b) =>
          b.type === 'github' &&
          b.content.type === 'pages build and deployment' &&
          (b.content.conclusion === 'cancelled' || b.content.conclusion === 'success')
      ).length >= 2 &&
      base.bubbles.some((b) => b.type === 'railway' && b.content.status === 'SUCCESS')
        ? indexToUrls(app.index)
        : undefined,
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
