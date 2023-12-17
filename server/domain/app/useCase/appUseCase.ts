import type { AppModel } from '$/commonTypesWithClient/appModels';
import { type UserModel } from '$/commonTypesWithClient/appModels';
import type { AppId, Maybe } from '$/commonTypesWithClient/branded';
import { prismaClient, transaction } from '$/service/prismaClient';
import { setTimeout } from 'timers/promises';
import { appMethods } from '../model/appMethods';
import { appQuery } from '../query/appQuery';
import { appRepo } from '../repository/appRepo';
import { githubRepo } from '../repository/githubRepo';
import { railwayRepo } from '../repository/railwayRepo';

export const appUseCase = {
  create: (user: UserModel, desc: string) =>
    transaction<AppModel>(async (tx) => {
      const [count, waitingCount] = await Promise.all([
        appQuery.countAll(tx),
        appQuery.countWaitings(tx),
      ]);
      const app = appMethods.create(user, count, waitingCount, desc);
      await appRepo.save(tx, app);

      return app;
    }),
  updateGHActions: (appId: Maybe<AppId>) =>
    transaction(async (tx) => {
      const app = await appQuery.findByIdOrThrow(tx, appId);

      if (app.status === 'waiting' || Date.now() - app.githubUpdatedTime < 10_000) return app;

      const list = await githubRepo.listActionsAll(app);
      const newApp = appMethods.upsertGitHubBubbles(app, list);
      await appRepo.save(tx, newApp);
    }),
  updateRWDeployments: (appId: Maybe<AppId>) =>
    transaction(async (tx) => {
      const app = await appQuery.findByIdOrThrow(tx, appId);

      if (app.status === 'waiting' || Date.now() - app.railwayUpdatedTime < 10_000) return app;

      const list = await railwayRepo.listDeploymentsAll(tx, app);
      const newApp = appMethods.upsertRailwayBubbles(app, list);
      await appRepo.save(tx, newApp);
    }),
  initOneByOne: async () => {
    let prevTime = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      await setTimeout(1000);

      if (Date.now() - prevTime < 30_000) continue;

      const waiting = await appQuery.findWaitingHead(prismaClient);

      if (waiting === undefined) continue;

      await githubRepo.create(waiting);
      const railway = await railwayRepo.create(waiting);
      const app = appMethods.init(waiting, railway);

      await appRepo.save(prismaClient, app);
      prevTime = Date.now();
    }
  },
  watchBubbleContents: async () => {
    let prevTime = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      await setTimeout(1000);

      if (Date.now() - prevTime < 600_000) continue;

      const apps = await appQuery.findAll(prismaClient);

      for (const app of apps) {
        await appUseCase
          .updateGHActions(app.id)
          .then(() => appUseCase.updateRWDeployments(app.id))
          .catch(() => null);
      }

      prevTime = Date.now();
    }
  },
};
