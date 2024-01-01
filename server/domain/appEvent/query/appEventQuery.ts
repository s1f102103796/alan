import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { BubbleModel } from '$/commonTypesWithClient/bubbleModels';
import { appQuery } from '$/domain/app/query/appQuery';
import type { AppEventId } from '$/service/branded';
import { appEventIdParser, appIdParser } from '$/service/idParsers';
import { customAssert } from '$/service/returnStatus';
import type { AppEvent, Prisma } from '@prisma/client';
import type { AppEventModel, AppEventStatus, SubscriberId } from '../model/appEventModels';
import {
  appEventStatusParser,
  appEventTypeParser,
  appSubscriberIdParser,
} from '../model/appEventModels';

const toEventModel = (event: AppEvent, app: AppModel, bubble: BubbleModel): AppEventModel => {
  return {
    id: appEventIdParser.parse(event.id),
    subscriberId: appSubscriberIdParser.parse(event.subscriberId),
    type: appEventTypeParser.parse(event.type),
    status: appEventStatusParser.parse(event.status),
    createdTime: event.createdAt.getTime(),
    updatedTime: event.updatedAt.getTime(),
    failedCount: event.failedCount,
    app,
    bubble,
  };
};

export const appEventQuery = {
  findByIdOrThrow: async (tx: Prisma.TransactionClient, id: AppEventId): Promise<AppEventModel> => {
    const prismaEvent = await tx.appEvent.findUniqueOrThrow({ where: { id } });

    const app = await appQuery.findByIdOrThrow(tx, appIdParser.parse(prismaEvent.appId));
    const bubble = app.bubbles.find((b) => b.id === prismaEvent.bubbleId);

    customAssert(bubble, 'エラーならロジック修正必須');

    return toEventModel(prismaEvent, app, bubble);
  },
  findHead: async (
    tx: Prisma.TransactionClient,
    subscriberId: SubscriberId,
    status: AppEventStatus
  ): Promise<AppEventModel | null> => {
    const prismaEvent = await tx.appEvent.findFirst({
      where: { subscriberId, status },
      orderBy: { updatedAt: 'desc' },
    });

    if (prismaEvent === null) return null;

    const app = await appQuery.findByIdOrThrow(tx, appIdParser.parse(prismaEvent.appId));
    const bubble = app.bubbles.find((b) => b.id === prismaEvent.bubbleId);

    customAssert(bubble, 'エラーならロジック修正必須');

    return toEventModel(prismaEvent, app, bubble);
  },
};
