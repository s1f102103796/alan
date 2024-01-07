import type { AppModel, InitAppModel, RailwayModel } from '$/commonTypesWithClient/appModels';
import { type UserModel } from '$/commonTypesWithClient/appModels';
import type { AppId } from '$/commonTypesWithClient/branded';
import type { RWDeploymentModel, SystemStatus } from '$/commonTypesWithClient/bubbleModels';
import { appEventUseCase } from '$/domain/appEvent/useCase/appEventUseCase';
import { transaction } from '$/service/prismaClient';
import { customAssert } from '$/service/returnStatus';
import type { Prisma } from '@prisma/client';
import { appMethods } from '../model/appMethods';
import { bubbleMethods } from '../model/bubbleMethods';
import { appQuery } from '../query/appQuery';
import { appRepo } from '../repository/appRepo';
import { githubUseCase } from './githubUseCase';

export const appUseCase = {
  create: (user: UserModel, desc: string): Promise<AppModel> =>
    transaction('Serializable', async (tx) => {
      const [count, waitingCount] = await Promise.all([
        appQuery.countAll(tx),
        appQuery.countWaitings(tx),
      ]);
      const app = appMethods.create(user, count, waitingCount, desc);
      await appRepo.save(tx, app);
      const dispatcher = await appEventUseCase.create(tx, 'AppCreated', app);

      return { app, dispatcher };
    }).then(({ app, dispatcher }) => {
      dispatcher.dispatchAfterTransaction();
      return app;
    }),
  init: (appId: AppId) =>
    transaction('RepeatableRead', async (tx) => {
      const waiting = await appQuery.findByIdOrThrow(tx, appId);
      customAssert(waiting.status === 'waiting', 'エラーならロジック修正必須');

      const inited = appMethods.init(waiting);
      await appRepo.save(tx, inited);

      return inited;
    }),
  addSystemBubble: (appId: AppId, systemStatus: SystemStatus) =>
    transaction('RepeatableRead', async (tx) => {
      const app = await appQuery.findByIdOrThrow(tx, appId);
      const newApp = appMethods.addBubble(
        app,
        bubbleMethods.createSystem(systemStatus, Date.now())
      );
      await appRepo.save(tx, newApp);
    }),
  addSystemBubbleIfNotExists: (appId: AppId, systemStatus: SystemStatus) =>
    transaction('RepeatableRead', async (tx) => {
      const app = await appQuery.findByIdOrThrow(tx, appId);
      if (app.bubbles.some((b) => b.type === 'system' && b.content === systemStatus)) return;

      const newApp = appMethods.addBubble(
        app,
        bubbleMethods.createSystem(systemStatus, Date.now())
      );
      await appRepo.save(tx, newApp);
    }),
  completeRailwayInit: async (
    tx: Prisma.TransactionClient,
    inited: InitAppModel,
    railway: RailwayModel
  ) => {
    const running = appMethods.run(inited, railway);
    await appRepo.save(tx, running);

    return await appEventUseCase.create(tx, 'RailwayCreated', running);
  },
  updateRWDeployments: (appId: AppId, deployments: RWDeploymentModel[]) =>
    transaction('RepeatableRead', async (tx) => {
      const app = await appQuery.findByIdOrThrow(tx, appId);
      const newApp = appMethods.upsertRailwayBubbles(app, deployments);

      await appRepo.save(tx, newApp);
    }),
  callWhenServerStarted: () => {
    githubUseCase.checkAndResetGHActionsWhileServerWasDown();
  },
};
