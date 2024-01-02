import type {
  ActiveAppModel,
  AppModel,
  InitAppModel,
  RailwayModel,
  WaitingAppModel,
} from '$/commonTypesWithClient/appModels';
import { type UserModel } from '$/commonTypesWithClient/appModels';
import type { AppId, Maybe } from '$/commonTypesWithClient/branded';
import { appEventUseCase } from '$/domain/appEvent/useCase/appEventUseCase';
import { prismaClient, transaction } from '$/service/prismaClient';
import { customAssert } from '$/service/returnStatus';
import type { Prisma } from '@prisma/client';
import { setTimeout } from 'timers/promises';
import { appMethods } from '../model/appMethods';
import { bubbleMethods } from '../model/bubbleMethods';
import { appQuery } from '../query/appQuery';
import { appRepo } from '../repository/appRepo';
import { githubRepo } from '../repository/githubRepo';
import type { GitDiffModel } from '../repository/llmRepo';
import { llmRepo } from '../repository/llmRepo';
import { localGitRepo } from '../repository/localGitRepo';
import { railwayRepo } from '../repository/railwayRepo';

const retryTest = (app: ActiveAppModel) =>
  transaction<ActiveAppModel>('RepeatableRead', async (tx) => {
    const retriedApp = await appQuery.findByIdOrThrow(tx, app.id);

    customAssert(retriedApp.status === 'running', 'エラーならロジック修正必須');

    const retrying = appMethods.retry(retriedApp);
    await appRepo.save(tx, retrying);

    return retrying;
  });

const pushGitDiff = async (running: ActiveAppModel, gitDiff: GitDiffModel) => {
  await localGitRepo.pushToRemote(running, gitDiff);
  await transaction('RepeatableRead', async (tx) => {
    const app = appMethods.addBubble(
      await appQuery.findByIdOrThrow(tx, running.id),
      bubbleMethods.createAiOrHuman(
        'ai',
        `「${gitDiff.newMessage}」をGitHubにPushしました。`,
        Date.now()
      )
    );
    await appRepo.save(tx, app);
  });
};

const retryFailedTest = async () => {
  const apps = await appQuery.findAll(prismaClient);

  await Promise.all(
    apps.map(async (app) => {
      const retryed = app.bubbles.filter((b) => b.type === 'system' && b.content === 'retry_test');
      const failed = app.bubbles.flatMap((b) =>
        b.type === 'github' && b.content.status === 'failure' ? b : []
      );

      if (retryed.length === failed.length) return;

      const ghAction = failed.at(-1);
      customAssert(ghAction, 'エラーならロジック修正必須');

      const failedStep = await githubRepo.findFailedStepOrThrow(app, ghAction.content);
      customAssert(app.status === 'running', 'エラーならロジック修正必須');

      const retryingApp = await retryTest(app);
      const localGit = await localGitRepo.getFiles(retryingApp);
      const gitDiff = await llmRepo.retryApp(retryingApp, localGit, failedStep);

      if (gitDiff !== null) await pushGitDiff(retryingApp, gitDiff);
    })
  );
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
      dispatcher.dispatch();
      return app;
    }),
  init: async (tx: Prisma.TransactionClient, waiting: WaitingAppModel) => {
    const inited = appMethods.init(waiting);
    await appRepo.save(tx, inited);

    return inited;
  },
  completeGitHubInit: async (tx: Prisma.TransactionClient, inited: InitAppModel) => {
    const bubble = bubbleMethods.createSystem('completed_github', Date.now());
    const app = appMethods.addBubble(inited, bubble);
    await appRepo.save(tx, app);

    return await appEventUseCase.create(tx, 'GitHubCreated', app);
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
  pushedGitDiff: (app: AppModel, gitDiff: GitDiffModel) =>
    transaction('RepeatableRead', async (tx) => {
      const newApp = appMethods.addBubble(
        await appQuery.findByIdOrThrow(tx, app.id),
        bubbleMethods.createAiOrHuman(
          'ai',
          `「${gitDiff.newMessage}」をGitHubにPushしました。`,
          Date.now()
        )
      );
      await appRepo.save(tx, newApp);
    }),
  updateGHActions: (appId: Maybe<AppId>) =>
    transaction('RepeatableRead', async (tx) => {
      const app = await appQuery.findByIdOrThrow(tx, appId);

      if (app.status === 'waiting' || Date.now() - app.githubUpdatedTime < 10_000) return app;

      const list = await githubRepo.listActionsAll(app);
      const newApp = appMethods.upsertGitHubBubbles(app, list);
      await appRepo.save(tx, newApp);
    }),
  updateRWDeployments: (appId: Maybe<AppId>) =>
    transaction('RepeatableRead', async (tx) => {
      const app = await appQuery.findByIdOrThrow(tx, appId);

      if (
        app.status === 'waiting' ||
        app.status === 'init' ||
        Date.now() - app.railwayUpdatedTime < 10_000
      ) {
        return app;
      }

      const list = await railwayRepo.listDeploymentsAll(app);
      const newApp = appMethods.upsertRailwayBubbles(app, list);

      await appRepo.save(tx, newApp);
    }),
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

      await retryFailedTest();
      await setTimeout(600_000 - Date.now() + prevTime);
    }
  },
};
