import type {
  AppModel,
  InitAppModel,
  RailwayModel,
  WaitingAppModel,
} from '$/commonTypesWithClient/appModels';
import { type UserModel } from '$/commonTypesWithClient/appModels';
import { appEventUseCase } from '$/domain/appEvent/useCase/appEventUseCase';
import { prismaClient, transaction } from '$/service/prismaClient';
import type { Prisma } from '@prisma/client';
import { setTimeout } from 'timers/promises';
import { appMethods } from '../model/appMethods';
import { appQuery } from '../query/appQuery';
import { appRepo } from '../repository/appRepo';
import { railwayRepo } from '../repository/railwayRepo';
import { githubUseCase } from './githubUseCase';

const watchRWDeployments = async () => {
  let prevTime = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    prevTime = Date.now();

    const apps = await appQuery.findAll(prismaClient);

    for (const app of apps) {
      await transaction('RepeatableRead', async (tx) => {
        const target = await appQuery.findByIdOrThrow(tx, app.id);

        if (
          target.status === 'waiting' ||
          target.status === 'init' ||
          Date.now() - target.railwayUpdatedTime < 10_000
        ) {
          return target;
        }

        const list = await railwayRepo.listDeploymentsAll(target);
        const newApp = appMethods.upsertRailwayBubbles(app, list);

        await appRepo.save(tx, newApp);
      }).catch(() => null);
    }

    await setTimeout(600_000 - Date.now() + prevTime);
  }
};

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
  init: async (tx: Prisma.TransactionClient, waiting: WaitingAppModel) => {
    const inited = appMethods.init(waiting);
    await appRepo.save(tx, inited);

    return inited;
  },
  completeRailwayInit: async (
    tx: Prisma.TransactionClient,
    inited: InitAppModel,
    railway: RailwayModel
  ) => {
    const running = appMethods.run(inited, railway);
    await appRepo.save(tx, running);

    return await appEventUseCase.create(tx, 'RailwayCreated', running);
  },
  callWhenServerStarted: () => {
    githubUseCase.checkAndResetGHActionsWhileServerWasDown();
    watchRWDeployments();
  },
};
