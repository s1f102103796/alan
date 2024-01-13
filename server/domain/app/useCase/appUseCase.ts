import type {
  AppModel,
  InitAppModel,
  OgpImage,
  RailwayModel,
} from '$/commonTypesWithClient/appModels';
import { type UserModel } from '$/commonTypesWithClient/appModels';
import type { AppId } from '$/commonTypesWithClient/branded';
import type {
  RWDeploymentModel,
  SystemStatus,
  TaskModel,
} from '$/commonTypesWithClient/bubbleModels';
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
  create: (user: UserModel, name: string, similarName: string): Promise<AppModel> =>
    transaction('Serializable', async (tx) => {
      const [count, waitingCount] = await Promise.all([
        appQuery.countAll(tx),
        appQuery.countWaitings(tx),
      ]);
      const app = appMethods.create(user, count, waitingCount, name, similarName);
      await appRepo.save(tx, app);
      const dispatcher = await appEventUseCase.createWithLatestBubble(tx, 'AppCreated', app);

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
  completeOgpInit: async (
    tx: Prisma.TransactionClient,
    inited: InitAppModel,
    ogpImage: OgpImage
  ) => {
    const app = appMethods.setOgp(inited, ogpImage);
    await appRepo.save(tx, app);

    return await appEventUseCase.createWithLatestBubble(tx, 'OgpImageCreated', app);
  },
  completeRailwayInit: async (
    tx: Prisma.TransactionClient,
    inited: InitAppModel,
    railway: RailwayModel
  ) => {
    const app = appMethods.setRailway(inited, railway);
    await appRepo.save(tx, app);

    return await appEventUseCase.createWithLatestBubble(tx, 'RailwayCreated', app);
  },
  completeTaskListInit: async (
    tx: Prisma.TransactionClient,
    inited: InitAppModel,
    taskList: TaskModel[]
  ) => {
    const app = appMethods.addTaskListBubble(inited, taskList);
    await appRepo.save(tx, app);

    return await appEventUseCase.createWithLatestBubble(tx, 'TaskListCreated', app);
  },
  run: async (
    tx: Prisma.TransactionClient,
    inited: InitAppModel,
    ogpImage: OgpImage,
    railway: RailwayModel,
    taskList: TaskModel[]
  ) => {
    const running = appMethods.run(inited, ogpImage, railway, taskList);
    await appRepo.save(tx, running);

    return await appEventUseCase.createWithLatestBubble(tx, 'AppRunning', running);
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
