import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { AppEventId } from '$/commonTypesWithClient/branded';
import type { BubbleModel } from '$/commonTypesWithClient/bubbleModels';
import { appEventIdParser } from '$/commonTypesWithClient/idParsers';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { appEventUseCase } from '../useCase/appEventUseCase';

export const appEventStatusParser = z.enum([
  'waiting',
  'published',
  'failed',
  'completed',
  'destroyed',
]);

export type AppEventStatus = z.infer<typeof appEventStatusParser>;
export const appEventTypeParser = z.enum([
  'AppCreated',
  'GitHubCreated',
  'MainBranchPushed',
  'OgpImageCreated',
  'RailwayCreated',
  'TaskListCreated',
  'AppRunning',
  'SchemaCreated',
  'ApiDefined',
  'ClientTestWasSuccess',
  'ClientTestWasFailure',
  'ServerTestWasSuccess',
  'ServerTestWasFailure',
]);
export type AppEventType = z.infer<typeof appEventTypeParser>;
export const appSubscriberIdParser = z.enum([
  'createGitHub',
  'createOgpImage',
  'createRailway',
  'createTaskList',
  'checkRunningStatus',
  'watchRailway',
  'watchRailwayOnce',
  'createSchema',
  'createApiDefinition',
  'createClientCode',
  'createServerCode',
  'fixClientCode',
  'fixServerCode',
]);
export type SubscriberId = z.infer<typeof appSubscriberIdParser>;

export type AppEventModel = {
  id: AppEventId;
  type: AppEventType;
  app: AppModel;
  bubble: BubbleModel;
  subscriberId: SubscriberId;
  status: AppEventStatus;
  createdTime: number;
  updatedTime: number;
  failedCount: number;
};

export type AppEventDispatcher = { dispatchAfterTransaction: () => void };

// 関数にしないとESModulesの循環参照でビルド出来なくなる
const appSubscriberDict = (): {
  [Type in AppEventType]: { id: SubscriberId; fn: () => void }[];
} => ({
  AppCreated: [{ id: 'createGitHub', fn: appEventUseCase.createGitHub }],
  GitHubCreated: [
    { id: 'createOgpImage', fn: appEventUseCase.createOgpImage },
    { id: 'createRailway', fn: appEventUseCase.createRailway },
    { id: 'createTaskList', fn: appEventUseCase.createTaskList },
  ],
  MainBranchPushed: [{ id: 'watchRailway', fn: appEventUseCase.watchRailway }],
  OgpImageCreated: [{ id: 'checkRunningStatus', fn: appEventUseCase.checkRunningStatus }],
  RailwayCreated: [
    { id: 'watchRailwayOnce', fn: appEventUseCase.watchRailwayOnce },
    { id: 'checkRunningStatus', fn: appEventUseCase.checkRunningStatus },
  ],
  TaskListCreated: [
    { id: 'checkRunningStatus', fn: appEventUseCase.checkRunningStatus },
    { id: 'createSchema', fn: appEventUseCase.createSchema },
  ],
  AppRunning: [],
  SchemaCreated: [{ id: 'createApiDefinition', fn: appEventUseCase.createApiDef }],
  ApiDefined: [
    { id: 'createClientCode', fn: appEventUseCase.createClientCode },
    { id: 'createServerCode', fn: appEventUseCase.createServerCode },
  ],
  ClientTestWasSuccess: [],
  ClientTestWasFailure: [{ id: 'fixClientCode', fn: appEventUseCase.fixClientCode }],
  ServerTestWasSuccess: [],
  ServerTestWasFailure: [{ id: 'fixServerCode', fn: appEventUseCase.fixServerCode }],
});

export const appEventMethods = {
  create: (
    type: AppEventType,
    app: AppModel,
    bubble: BubbleModel
  ): { events: AppEventModel[]; dispatcher: AppEventDispatcher } => {
    const events = appSubscriberDict()[type].map(
      (sub): AppEventModel => ({
        id: appEventIdParser.parse(randomUUID()),
        type,
        app,
        bubble,
        subscriberId: sub.id,
        status: 'waiting',
        createdTime: Date.now(),
        updatedTime: Date.now(),
        failedCount: 0,
      })
    );

    return {
      events,
      dispatcher: {
        dispatchAfterTransaction: () => {
          const subs = appSubscriberDict()[type];
          events.forEach((ev) => subs.find((sub) => sub.id === ev.subscriberId)?.fn());
        },
      },
    };
  },
  publish: (event: AppEventModel): AppEventModel => ({
    ...event,
    status: 'published',
    updatedTime: Date.now(),
  }),
  complete: (event: AppEventModel): AppEventModel => ({
    ...event,
    status: 'completed',
    updatedTime: Date.now(),
  }),
  fail: (event: AppEventModel): AppEventModel => {
    const failedCount = event.failedCount + 1;

    return {
      ...event,
      status: failedCount < 10 ? 'failed' : 'destroyed',
      updatedTime: Date.now(),
      failedCount,
    };
  },
};
