import type { WorkflowRun } from '$/api/webhooks/github/validator';
import type { ActiveAppModel, AppModel, InitAppModel } from '$/commonTypesWithClient/appModels';
import type { DisplayId } from '$/commonTypesWithClient/branded';
import { appEventUseCase } from '$/domain/appEvent/useCase/appEventUseCase';
import { API_ORIGIN, NGROK_TOKEN } from '$/service/envValues';
import { prismaClient, transaction } from '$/service/prismaClient';
import { customAssert } from '$/service/returnStatus';
import type { Prisma } from '@prisma/client';
import { connect } from 'ngrok';
import { appMethods } from '../model/appMethods';
import { bubbleMethods } from '../model/bubbleMethods';
import { appQuery } from '../query/appQuery';
import { appRepo } from '../repository/appRepo';
import { githubRepo } from '../repository/githubRepo';
import type { GitDiffModel } from '../repository/llmRepo';
import { llmRepo } from '../repository/llmRepo';
import { localGitRepo } from '../repository/localGitRepo';

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
        b.type === 'github' && b.content.conclusion === 'failure' ? b : []
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

const connectNgrokIfLocal = async () => {
  if (!API_ORIGIN.startsWith('http://localhost')) return;

  const origin = await connect({
    addr: +new URL(API_ORIGIN).port,
    authtoken: NGROK_TOKEN,
    region: 'jp',
    onStatusChange: async (status) => {
      if (status !== 'closed') return;
      await connectNgrokIfLocal();
      const apps = await appQuery.findAll(prismaClient);

      for (const app of apps) {
        await githubRepo.resetWebhook(app).catch(() => null);
      }
    },
  });

  console.log('Ngrok: ', origin);
};

export const githubUseCase = {
  completeGitHubInit: async (tx: Prisma.TransactionClient, inited: InitAppModel) => {
    const bubble = bubbleMethods.createSystem('completed_github', Date.now());
    const app = appMethods.addBubble(inited, bubble);
    await appRepo.save(tx, app);

    return await appEventUseCase.create(tx, 'GitHubCreated', app);
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
  updateByWebhook: (displayId: DisplayId, workflowRun: WorkflowRun) =>
    transaction('RepeatableRead', async (tx) => {
      const app = await appQuery.findByDisplayIdOrThrow(tx, displayId);
      const newApp = appMethods.upsertGitHubBubbles(app, [
        githubRepo.workflowRunToModel(app, workflowRun),
      ]);
      await appRepo.save(tx, newApp);
    }),
  checkAndResetGHActionsWhileServerWasDown: async () => {
    await connectNgrokIfLocal();
    const apps = await appQuery.findAll(prismaClient);

    for (const app of apps) {
      await githubRepo.resetWebhook(app).catch(() => null);
      await githubRepo
        .listActionsAll(app)
        .then((list) =>
          transaction('RepeatableRead', async (tx) => {
            const target = await appQuery.findByIdOrThrow(tx, app.id);
            const newApp = appMethods.upsertGitHubBubbles(target, list);
            await appRepo.save(tx, newApp);
          })
        )
        .then(retryFailedTest)
        .catch(() => null);
    }
  },
};
