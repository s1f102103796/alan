import type { AppModel, AppModelBase, WaitingAppModel } from '$/commonTypesWithClient/appModels';
import { APP_STATUSES } from '$/commonTypesWithClient/appModels';
import type { BubbleModel, TaskModel } from '$/commonTypesWithClient/bubbleModels';
import {
  bubbleTypeParser,
  parseGHAction,
  parseRWDeployment,
  parseTask,
  systemStatusParser,
} from '$/commonTypesWithClient/bubbleModels';
import { appIdParser, bubbleIdParser, userIdParser } from '$/commonTypesWithClient/idParsers';
import { customAssert } from '$/service/returnStatus';
import type { App, Bubble, GitHubAction, RailwayDeployment, Task, User } from '@prisma/client';
import { z } from 'zod';
import {
  indexToDisplayId,
  indexToUrls,
  projectIdToUrl,
  toBranchUrl,
  toCommitUrl,
  toGHActionUrl,
  toOgpImage,
  toRWDeployUrl,
} from './utils';

type PrismaBubble = Bubble & {
  GitHubAction: GitHubAction | null;
  RailwayDeployment: RailwayDeployment | null;
  taskList: Task[];
};

type PrismaApp = App & { User: User; bubbles: PrismaBubble[]; taskList: Task[] };

const toTaskList = (taskList: Task[]): TaskModel[] =>
  taskList.map((task) =>
    parseTask({ id: task.id, title: task.title, content: task.content, done: task.done })
  );

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
          branchUrl: toBranchUrl(indexToDisplayId(app.index), bubble.RailwayDeployment.branch),
          commitId: bubble.RailwayDeployment.commitId,
          commitUrl: toCommitUrl(indexToDisplayId(app.index), bubble.RailwayDeployment.commitId),
          createdTime: bubble.createdAt.getTime(),
          updatedTime: bubble.RailwayDeployment.updatedAt.getTime(),
        }),
      };
    case 'taskList':
      return { ...base, type, content: toTaskList(bubble.taskList) };
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
    similarName: app.similarName,
    createdTime: app.createdAt.getTime(),
    bubbles,
  };
};

export const toWaitingAppModel = (app: PrismaApp, waitingIds: string[]): WaitingAppModel => {
  return {
    ...toAppModelBase(app),
    status: 'waiting',
    waitingOrder: waitingIds.indexOf(app.id) + 1,
  };
};

const toRailway = (
  environmentId: string,
  projectId: string,
  serviceId: string
): Required<AppModel>['railway'] => ({
  url: projectIdToUrl(projectId),
  environmentId,
  projectId,
  serviceId,
});

// eslint-disable-next-line complexity
export const toAppModel = (app: PrismaApp, waitingIds: string[]): AppModel => {
  const status = z.enum(APP_STATUSES).parse(app.status);

  if (status === 'waiting') return toWaitingAppModel(app, waitingIds);
  if (status === 'init') {
    const ogpImage =
      app.ogpImageName !== null && app.ogpImagePrompt !== null
        ? toOgpImage(app.index, app.ogpImageName, app.ogpImagePrompt)
        : undefined;
    const railway =
      app.environmentId !== null && app.projectId !== null && app.serviceId !== null
        ? toRailway(app.environmentId, app.projectId, app.serviceId)
        : undefined;
    const taskList = app.taskList.length > 0 ? toTaskList(app.taskList) : undefined;
    return { ...toAppModelBase(app), status: 'init', ogpImage, railway, taskList };
  }

  customAssert(app.environmentId !== null, 'エラーならロジック修正必須');
  customAssert(app.projectId !== null, 'エラーならロジック修正必須');
  customAssert(app.serviceId !== null, 'エラーならロジック修正必須');
  customAssert(app.ogpImageName !== null, 'エラーならロジック修正必須');
  customAssert(app.ogpImagePrompt !== null, 'エラーならロジック修正必須');
  customAssert(app.taskList.length > 0, 'エラーならロジック修正必須');

  const base = toAppModelBase(app);

  return {
    ...base,
    status,
    urls:
      base.bubbles.some(
        (b) =>
          b.type === 'github' &&
          b.content.type === 'pages build and deployment with artifacts-next' &&
          b.content.conclusion === 'success'
      ) && base.bubbles.some((b) => b.type === 'railway' && b.content.status === 'SUCCESS')
        ? indexToUrls(app.index)
        : undefined,
    ogpImage: toOgpImage(app.index, app.ogpImageName, app.ogpImagePrompt),
    railway: toRailway(app.environmentId, app.projectId, app.serviceId),
    taskList: toTaskList(app.taskList),
  };
};
