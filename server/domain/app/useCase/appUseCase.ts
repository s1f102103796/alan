import type { AppModel } from '$/commonTypesWithClient/appModels';
import { type UserModel } from '$/commonTypesWithClient/appModels';
import type { AppId, Maybe } from '$/commonTypesWithClient/branded';
import { prismaClient, transaction } from '$/service/prismaClient';
import { setTimeout } from 'timers/promises';
import { appMethods } from '../model/appMethods';
import { appQuery } from '../query/appQuery';
import { appRepo } from '../repository/appRepo';
import { githubRepo } from '../repository/githubRepo';
import { llmRepo } from '../repository/llmRepo';
import { localGitRepo } from '../repository/localGitRepo';
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
    }, 'Serializable'),
  updateGHActions: (appId: Maybe<AppId>) =>
    transaction(async (tx) => {
      const app = await appQuery.findByIdOrThrow(tx, appId);

      if (app.status === 'waiting' || Date.now() - app.githubUpdatedTime < 10_000) return app;

      const list = await githubRepo.listActionsAll(app);
      const newApp = appMethods.upsertGitHubBubbles(app, list);
      await appRepo.save(tx, newApp);
    }, 'RepeatableRead'),
  updateRWDeployments: (appId: Maybe<AppId>) =>
    transaction(async (tx) => {
      const app = await appQuery.findByIdOrThrow(tx, appId);

      if (app.status === 'waiting' || Date.now() - app.railwayUpdatedTime < 10_000) return app;

      const list = await railwayRepo.listDeploymentsAll(tx, app);
      const newApp = appMethods.upsertRailwayBubbles(app, list);
      await appRepo.save(tx, newApp);
    }, 'RepeatableRead'),
  initOneByOne: async () => {
    let prevTime = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      prevTime = Date.now();

      const waiting = await appQuery.findWaitingHead(prismaClient);

      if (waiting === undefined) continue;

      await githubRepo.create(waiting).catch(() => null);
      const railway = await railwayRepo.create(waiting).catch(() => null);

      if (railway === null) continue;

      const app = appMethods.init(waiting, railway);

      await appRepo.save(prismaClient, app);
      await localGitRepo
        .getFiles(app)
        .then((localGit) => llmRepo.initApp(app, localGit))
        .then((gitDiff) =>
          gitDiff !== null ? localGitRepo.pushToRemote(app, gitDiff) : undefined
        );

      await setTimeout(600_000 - Date.now() + prevTime);
    }
  },
  watchBubbleContents: async () => {
    let prevTime = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      prevTime = Date.now();

      const apps = await appQuery.findAll(prismaClient);

      for (const app of apps) {
        await appUseCase
          .updateGHActions(app.id)
          .then(() => appUseCase.updateRWDeployments(app.id))
          .catch(() => null);
      }

      await setTimeout(600_000 - Date.now() + prevTime);
    }
  },
};
