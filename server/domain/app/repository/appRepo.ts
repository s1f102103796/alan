import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { Prisma } from '@prisma/client';

export const appRepo = {
  save: async (tx: Prisma.TransactionClient, app: AppModel) => {
    await tx.app.upsert({
      where: { id: app.id },
      update: {
        name: app.name,
        statusUpdatedAt: new Date(app.statusUpdatedTime),
        bubblesUpdatedAt: new Date(app.bubblesUpdatedTime),
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
        bubblesUpdatedAt: new Date(app.bubblesUpdatedTime),
        status: app.status,
        environmentId: app.railway?.environmentId,
        projectId: app.railway?.projectId,
        serviceId: app.railway?.serviceId,
      },
    });

    await Promise.all(
      app.bubbles.map(async (bubble, bIndex) => {
        await tx.bubble.upsert({
          where: { id: bubble.id },
          update: bubble.type === 'github' ? {} : { content: bubble.content },
          create: {
            id: bubble.id,
            type: bubble.type,
            index: bIndex,
            content: bubble.type === 'github' ? '' : bubble.content,
            createdAt: new Date(bubble.createdTime),
            App: { connect: { id: app.id } },
          },
        });

        if (bubble.type !== 'github') return;

        await tx.gitHubAction.upsert({
          where: { id: bubble.content.id },
          update: { status: bubble.content.status },
          create: {
            id: bubble.content.id,
            type: bubble.content.type,
            title: bubble.content.title,
            status: bubble.content.status,
            createdAt: new Date(bubble.content.createdTime),
            updatedAt: new Date(bubble.content.updatedTime),
            Bubble: { connect: { id: bubble.id } },
          },
        });
      })
    );
  },
};
