import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { Prisma } from '@prisma/client';

export const appRepo = {
  save: async (tx: Prisma.TransactionClient, app: AppModel) => {
    await tx.app.upsert({
      where: { id: app.id },
      update: {
        name: app.name,
        githubUpdatedAt: new Date(app.githubUpdatedTime),
        railwayUpdatedAt: new Date(app.railwayUpdatedTime),
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
        githubUpdatedAt: new Date(app.githubUpdatedTime),
        railwayUpdatedAt: new Date(app.railwayUpdatedTime),
        status: app.status,
        environmentId: app.railway?.environmentId,
        projectId: app.railway?.projectId,
        serviceId: app.railway?.serviceId,
      },
    });

    await Promise.all(
      // eslint-disable-next-line complexity
      app.bubbles.map(async (bubble) => {
        await tx.bubble.upsert({
          where: { id: bubble.id },
          update:
            bubble.type === 'github' || bubble.type === 'railway'
              ? {}
              : { content: bubble.content },
          create: {
            id: bubble.id,
            type: bubble.type,
            content: bubble.type === 'github' || bubble.type === 'railway' ? '' : bubble.content,
            createdAt: new Date(bubble.createdTime),
            App: { connect: { id: app.id } },
          },
        });

        switch (bubble.type) {
          case 'ai':
          case 'human':
          case 'system':
            break;
          case 'github':
            await tx.gitHubAction.upsert({
              where: { id: bubble.content.id },
              update: {
                status: bubble.content.status,
                updatedAt: new Date(bubble.content.updatedTime),
              },
              create: {
                id: bubble.content.id,
                type: bubble.content.type,
                title: bubble.content.title,
                status: bubble.content.status,
                branch: bubble.content.branch,
                commitId: bubble.content.commitId,
                updatedAt: new Date(bubble.content.updatedTime),
                Bubble: { connect: { id: bubble.id } },
              },
            });
            break;
          case 'railway':
            await tx.railwayDeployment.upsert({
              where: { id: bubble.content.id },
              update: {
                status: bubble.content.status,
                updatedAt: new Date(bubble.content.updatedTime),
              },
              create: {
                id: bubble.content.id,
                title: bubble.content.title,
                status: bubble.content.status,
                branch: bubble.content.branch,
                commitId: bubble.content.commitId,
                updatedAt: new Date(bubble.content.updatedTime),
                Bubble: { connect: { id: bubble.id } },
              },
            });
            break;
          default:
            throw new Error(bubble satisfies never);
        }
      })
    );
  },
};
