import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { BubbleModel } from '$/commonTypesWithClient/bubbleModels';
import type { AppEventId } from '$/service/branded';
import { appEventIdParser } from '$/service/idParsers';
import { customAssert } from '$/service/returnStatus';
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
  'RailwayCreated',
]);
export type AppEventType = z.infer<typeof appEventTypeParser>;
export const appSubscriberIdParser = z.enum([
  'createGitHub',
  'createRailway',
  'watchRailway',
  'watchRailwayOnce',
  'startDevelopment',
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

export const appSubscriberDict = (): {
  [Type in AppEventType]: { id: SubscriberId; fn: () => void }[];
} => ({
  AppCreated: [{ id: 'createGitHub', fn: appEventUseCase.createGitHub }],
  GitHubCreated: [
    { id: 'createRailway', fn: appEventUseCase.createRailway },
    { id: 'startDevelopment', fn: appEventUseCase.startDevelopment },
  ],
  MainBranchPushed: [{ id: 'watchRailway', fn: appEventUseCase.watchRailway }],
  RailwayCreated: [{ id: 'watchRailwayOnce', fn: appEventUseCase.watchRailwayOnce }],
});

export const appEventMethods = {
  create: (type: AppEventType, app: AppModel): AppEventModel[] =>
    appSubscriberDict()[type].map((sub): AppEventModel => {
      const bubble = app.bubbles.at(-1);
      customAssert(bubble, 'エラーならロジック修正必須');

      return {
        id: appEventIdParser.parse(randomUUID()),
        type,
        app,
        bubble,
        subscriberId: sub.id,
        status: 'waiting',
        createdTime: Date.now(),
        updatedTime: Date.now(),
        failedCount: 0,
      };
    }),
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
      status: failedCount < 3 ? 'failed' : 'destroyed',
      updatedTime: Date.now(),
      failedCount,
    };
  },
};
