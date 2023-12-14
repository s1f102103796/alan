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
    transaction<AppModel>(async (tx) => {
      const app = await appQuery.findByIdOrThrow(tx, appId);

      if (app.status === 'waiting' || Date.now() - app.githubUpdatedTime < 10_000) return app;

      const list = await githubRepo.listActionsAll(app);
      const newApp = appMethods.upsertGitHubBubbles(app, list);
      await appRepo.save(tx, newApp);

      return newApp;
    }),
  updateRWDeployments: (appId: Maybe<AppId>) =>
    transaction<AppModel>(async (tx) => {
      const app = await appQuery.findByIdOrThrow(tx, appId);

      if (app.status === 'waiting' || Date.now() - app.railwayUpdatedTime < 10_000) return app;

      const list = await railwayRepo.listDeploymentsAll(app);
      const newApp = appMethods.upsertRailwayBubbles(app, list);
      await appRepo.save(tx, newApp);

      return newApp;
    }),
  initOneByOne: async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const startTime = Date.now();
      const waiting = await appQuery.findWaitingHead(prismaClient);

      if (waiting === undefined) {
        await setTimeout(startTime + 3_000 - Date.now());
        continue;
      }

      await githubRepo.create(waiting);
      const railway = await railwayRepo.create(waiting);
      const app = appMethods.init(waiting, railway);

      await appRepo.save(prismaClient, app);
      await setTimeout(startTime + 30_000 - Date.now());
    }
  },
  watchBubbleContents: async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const startTime = Date.now();
      const apps = await appQuery.findAll(prismaClient);

      for (const app of apps) {
        await appUseCase.updateGHActions(app.id);
        await appUseCase.updateRWDeployments(app.id);
      }

      await setTimeout(startTime + 600_000 - Date.now());
    }
  },
};
