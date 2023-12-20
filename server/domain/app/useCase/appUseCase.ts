import type { AppModel } from '$/commonTypesWithClient/appModels';
import { type UserModel } from '$/commonTypesWithClient/appModels';
import type { AppId, Maybe } from '$/commonTypesWithClient/branded';
import { prismaClient, transaction } from '$/service/prismaClient';
import { customAssert } from '$/service/returnStatus';
import { setTimeout } from 'timers/promises';
import { appMethods } from '../model/appMethods';
import { bubbleMethods } from '../model/bubbleMethods';
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

      if (
        app.status === 'waiting' ||
        app.status === 'init' ||
        Date.now() - app.railwayUpdatedTime < 10_000
      )
        return app;

      const list = await railwayRepo.listDeploymentsAll(app);
      const newApp = appMethods.upsertRailwayBubbles(app, list);
      await appRepo.save(tx, newApp);
    }, 'RepeatableRead'),
  initOneByOne: async () => {
    let prevTime = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      prevTime = Date.now();

      const inited = await transaction(async (tx) => {
        const waiting = await appQuery.findWaitingHead(tx);

        if (waiting === undefined) return;

        const inited = appMethods.init(waiting);

        const res = await githubRepo.create(inited).catch(() => null);

        if (res === null) return;

        await appRepo.save(tx, inited);

        return inited;
      }, 'RepeatableRead');

      if (inited === undefined) continue;

      const railway = await railwayRepo.create(inited).catch(() => null);

      if (railway === null) continue;

      const running = await transaction(async (tx) => {
        const initedApp = await appQuery.findByIdOrThrow(tx, inited.id);

        customAssert(initedApp.status === 'init', 'エラーならロジック修正必須');

        const running = appMethods.run(initedApp, railway);
        await appRepo.save(tx, running);

        return running;
      }, 'RepeatableRead');

      const localGit = await localGitRepo.getFiles(running);
      const gitDiff = await llmRepo.initApp(running, localGit);

      if (gitDiff !== null) {
        await localGitRepo.pushToRemote(running, gitDiff);
        await transaction(async (tx) => {
          const app = appMethods.addBubble(
            await appQuery.findByIdOrThrow(tx, running.id),
            bubbleMethods.createAiOrHuman(
              'ai',
              `「${gitDiff.newMessage}」をGitHubにPushしました。`,
              Date.now()
            )
          );
          await appRepo.save(tx, app);
        }, 'RepeatableRead');
      }

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
