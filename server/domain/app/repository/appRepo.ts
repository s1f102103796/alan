import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { Prisma } from '@prisma/client';

export const appRepo = {
  save: async (tx: Prisma.TransactionClient, app: AppModel) => {
    await tx.app.upsert({
      where: { id: app.id },
      update: {
        name: app.name,
        statusUpdatedAt: new Date(app.statusUpdatedTime),
        status: app.status,
        environmentId: app.railway?.environmentId,
        projectId: app.railway?.projectId,
        serviceId: app.railway?.serviceId,
      },
      create: {
        id: app.id,
        userId: app.userId,
        index: app.index,
        name: app.name,
        createdAt: new Date(app.createdTime),
        statusUpdatedAt: new Date(app.statusUpdatedTime),
        status: app.status,
        environmentId: app.railway?.environmentId,
        projectId: app.railway?.projectId,
        serviceId: app.railway?.serviceId,
      },
    });

    await Promise.all(
      app.bubbles.map((bubble, bIndex) =>
        tx.bubble.upsert({
          where: { id: bubble.id },
          update: { content: bubble.content },
          create: {
            id: bubble.id,
            type: bubble.type,
            index: bIndex,
            content: bubble.content,
            createdAt: new Date(bubble.createdTime),
            App: { connect: { id: app.id } },
          },
        })
      )
    );
  },
};
