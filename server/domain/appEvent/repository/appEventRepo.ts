import type { Prisma } from '@prisma/client';
import type { AppEventModel } from '../model/appEventModels';

export const appEventRepo = {
  save: async (tx: Prisma.TransactionClient, event: AppEventModel) => {
    await tx.appEvent.upsert({
      where: { id: event.id },
      update: {
        status: event.status,
        updatedAt: new Date(event.updatedTime),
        failedCount: event.failedCount,
      },
      create: {
        id: event.id,
        type: event.type,
        appId: event.app.id,
        bubbleId: event.bubble.id,
        subscriberId: event.subscriberId,
        status: event.status,
        createdAt: new Date(event.createdTime),
        updatedAt: new Date(event.updatedTime),
        failedCount: event.failedCount,
      },
    });
  },
};
