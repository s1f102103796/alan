import type { GHWebhookBody, WorkflowRun } from '$/api/webhooks/github/validator';
import type { AppModel, InitAppModel } from '$/commonTypesWithClient/appModels';
import type { DisplayId } from '$/commonTypesWithClient/branded';
import type { GitDiffModel } from '$/domain/appEvent/repository/llmRepo';
import { appEventUseCase } from '$/domain/appEvent/useCase/appEventUseCase';
import { connectLocaltunnelIfLocal } from '$/service/localtunnel';
import { prismaClient, transaction } from '$/service/prismaClient';
import type { Prisma } from '@prisma/client';
import { appMethods } from '../model/appMethods';
import { bubbleMethods } from '../model/bubbleMethods';
import { appQuery } from '../query/appQuery';
import { appRepo } from '../repository/appRepo';
import { githubRepo } from '../repository/githubRepo';
import type { RemoteBranch } from '../repository/localGitRepo';

const updateWorkflowRun = async (displayId: DisplayId, workflowRun: WorkflowRun) =>
  // eslint-disable-next-line complexity
  transaction('RepeatableRead', async (tx) => {
    const app = await appQuery.findByDisplayIdOrThrow(tx, displayId);
    const newApp = appMethods.upsertGitHubBubbles(app, [
      githubRepo.workflowRunToModel(app, workflowRun),
    ]);
    await appRepo.save(tx, newApp);

    if (workflowRun.status !== 'completed') return;

    switch (workflowRun.name) {
      case 'pull request test':
      case 'client deployment':
      case 'pages build and deployment':
      case 'test':
        return;
      case 'client test':
        return await transaction('RepeatableRead', (tx) =>
          appEventUseCase.create(
            tx,
            workflowRun.conclusion === 'success' ? 'ClientTestWasSuccess' : 'ClientTestWasFailure',
            newApp
          )
        );
      case 'server test':
        return await transaction('RepeatableRead', (tx) =>
          appEventUseCase.create(
            tx,
            workflowRun.conclusion === 'success' ? 'ServerTestWasSuccess' : 'ServerTestWasFailure',
            newApp
          )
        );
      default:
        throw new Error(workflowRun.name satisfies never);
    }
  }).then((dispatcher) => dispatcher?.dispatchAfterTransaction());

const dispatchPushedEvent = async (displayId: DisplayId, ref: string) => {
  if (ref !== 'refs/heads/main') return;

  await transaction('RepeatableRead', async (tx) => {
    const app = await appQuery.findByDisplayIdOrThrow(tx, displayId);

    return await appEventUseCase.create(tx, 'MainBranchPushed', app);
  }).then(({ dispatchAfterTransaction }) => dispatchAfterTransaction());
};

export const githubUseCase = {
  completeGitHubInit: async (tx: Prisma.TransactionClient, inited: InitAppModel) => {
    const bubble = bubbleMethods.createSystem('completed_github', Date.now());
    const app = appMethods.addBubble(inited, bubble);
    await appRepo.save(tx, app);

    return await appEventUseCase.create(tx, 'GitHubCreated', app);
  },
  addGitBubble: (app: AppModel, remoteBranch: RemoteBranch, gitDiff: GitDiffModel) =>
    transaction('RepeatableRead', async (tx) => {
      const newApp = appMethods.addBubble(
        await appQuery.findByIdOrThrow(tx, app.id),
        bubbleMethods.createAiOrHuman(
          'ai',
          `「${gitDiff.newMessage}」を${remoteBranch}ブランチにPushしました。`,
          Date.now()
        )
      );
      await appRepo.save(tx, newApp);
    }),
  updateByWebhook: async (body: GHWebhookBody) => {
    if (body.ref !== undefined) {
      await dispatchPushedEvent(body.repository.name, body.ref);
      return;
    }

    if (body.workflow_run === undefined) return;

    await updateWorkflowRun(body.repository.name, body.workflow_run);
  },
  checkAndResetGHActionsWhileServerWasDown: async () => {
    await connectLocaltunnelIfLocal({
      onReconnect: async () => {
        const apps = await appQuery.findAll(prismaClient);

        for (const app of apps) {
          await githubRepo.resetWebhook(app);
        }
      },
    });
    const apps = await appQuery.findAll(prismaClient);

    for (const app of apps) {
      await githubRepo.resetWebhook(app);
    }
  },
};
