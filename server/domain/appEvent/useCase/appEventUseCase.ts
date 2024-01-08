/* eslint-disable max-lines */
import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { BubbleModel, SystemStatus } from '$/commonTypesWithClient/bubbleModels';
import { localGitRepo } from '$/domain/app/repository/localGitRepo';
import { railwayRepo } from '$/domain/app/repository/railwayRepo';
import { appUseCase } from '$/domain/app/useCase/appUseCase';
import { githubUseCase } from '$/domain/app/useCase/githubUseCase';
import { githubEventRepo } from '$/domain/appEvent/repository/githubEventRepo';
import { transaction } from '$/service/prismaClient';
import { customAssert } from '$/service/returnStatus';
import type { Prisma } from '@prisma/client';
import type { AppEventDispatcher, AppEventModel, AppEventType } from '../model/appEventModels';
import { appEventMethods, appSubscriberDict } from '../model/appEventModels';
import { appEventQuery } from '../query/appEventQuery';
import { appEventRepo } from '../repository/appEventRepo';
import { aspidaRepo } from '../repository/aspidaRepo';
import { llmRepo } from '../repository/llmRepo';
import { railwayEventUseCase } from './railwayEventUseCase';
import { subscribe } from './subscribe';

const addSystemBubbleOnce = async (evt: AppEventModel, status: SystemStatus) =>
  evt.failedCount === 0 && (await appUseCase.addSystemBubble(evt.app.id, status));

export const appEventUseCase = {
  create: async (
    tx: Prisma.TransactionClient,
    type: AppEventType,
    app: AppModel,
    bubble: BubbleModel
  ): Promise<AppEventDispatcher> => {
    const events = appEventMethods.create(type, app, bubble);
    await Promise.all(events.map((ev) => appEventRepo.save(tx, ev)));

    return {
      dispatchAfterTransaction: () => {
        const subs = appSubscriberDict()[type];
        events.forEach((ev) => subs.find((sub) => sub.id === ev.subscriberId)?.fn());
      },
    };
  },
  createWithLatestBubble: async (
    tx: Prisma.TransactionClient,
    type: AppEventType,
    app: AppModel
  ): Promise<AppEventDispatcher> => {
    const bubble = app.bubbles.at(-1);
    customAssert(bubble, 'エラーならロジック修正必須');

    return await appEventUseCase.create(tx, type, app, bubble);
  },
  callWhenServerStarted: async () => {
    await transaction('RepeatableRead', async (tx) => {
      const events = await appEventQuery.listByStatus(tx, 'published');
      await Promise.all(events.map((event) => appEventRepo.save(tx, appEventMethods.fail(event))));
    });

    appEventUseCase.createGitHub();
    appEventUseCase.createRailway();
    appEventUseCase.watchRailway();
    appEventUseCase.createSchema();
    appEventUseCase.createApiDef();
    appEventUseCase.createClientCode();
    appEventUseCase.createServerCode();
    appEventUseCase.fixClientCode();
    appEventUseCase.fixServerCode();
  },
  createGitHub: () =>
    subscribe('createGitHub', async (published) => {
      if (published.app.status !== 'waiting') return;

      customAssert(published.app.status === 'waiting', 'エラーならロジック修正必須');

      await appUseCase.init(published.app.id).then(githubEventRepo.createRemote);

      await transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.complete(event));

        customAssert(event.app.status === 'init', 'エラーならロジック修正必須');

        return await githubUseCase.completeGitHubInit(tx, event.app);
      }).then(({ dispatchAfterTransaction }) => dispatchAfterTransaction());
    }),
  createRailway: () =>
    subscribe('createRailway', async (published) => {
      customAssert(published.app.status === 'init', 'エラーならロジック修正必須');

      const railway = await railwayRepo.create(published.app);
      await transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.complete(event));

        customAssert(event.app.status === 'init', 'エラーならロジック修正必須');
        return await appUseCase.completeRailwayInit(tx, event.app, railway);
      }).then(({ dispatchAfterTransaction }) => dispatchAfterTransaction());
    }),
  watchRailway: () =>
    subscribe('watchRailway', async (published) => {
      if (published.app.status === 'waiting' || published.app.status === 'init') {
        return await transaction('RepeatableRead', async (tx) => {
          const event = await appEventQuery.findByIdOrThrow(tx, published.id);
          await appEventRepo.save(tx, appEventMethods.complete(event));
        });
      }

      await railwayEventUseCase.watchDeployments(published);
    }),
  watchRailwayOnce: () => subscribe('watchRailwayOnce', railwayEventUseCase.watchDeployments),
  createSchema: () =>
    subscribe('createSchema', async (published) => {
      await addSystemBubbleOnce(published, 'creating_schema');
      await githubEventRepo.createSchema(published.app);
      await transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.complete(event));

        return await appEventUseCase.createWithLatestBubble(tx, 'SchemaCreated', event.app);
      }).then(({ dispatchAfterTransaction }) => dispatchAfterTransaction());
    }),
  createApiDef: () =>
    subscribe('createApiDefinition', async (published) => {
      await addSystemBubbleOnce(published, 'creating_api_def');
      await githubEventRepo.createApiDef(published.app);
      await transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.complete(event));

        return await appEventUseCase.createWithLatestBubble(tx, 'ApiDefined', event.app);
      }).then(({ dispatchAfterTransaction }) => dispatchAfterTransaction());
    }),
  createClientCode: () =>
    subscribe('createClientCode', async (published) => {
      await addSystemBubbleOnce(published, 'creating_client_code');
      const localGit = await localGitRepo.getFiles(published.app, 'deus/test-client');
      const aspidaFiles = await aspidaRepo.generateFromOpenapi(published.app);
      const gitDiff = await llmRepo.initClient(published.app, localGit, aspidaFiles);

      await localGitRepo.pushToRemoteOrThrow(published.app, localGit, gitDiff, 'deus/test-client');
      await githubUseCase.addGitBubble(published.app, 'deus/test-client', gitDiff);

      await transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.complete(event));
      });
    }),
  createServerCode: () =>
    subscribe('createServerCode', async (published) => {
      await addSystemBubbleOnce(published, 'creating_server_code');
      const localGit = await localGitRepo.getFiles(published.app, 'deus/test-server');
      const aspidaFiles = await aspidaRepo.generateFromOpenapi(published.app);
      const gitDiff = await llmRepo.initServer(published.app, localGit, aspidaFiles);

      await localGitRepo.pushToRemoteOrThrow(published.app, localGit, gitDiff, 'deus/test-server');
      await githubUseCase.addGitBubble(published.app, 'deus/test-server', gitDiff);

      await transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.complete(event));
      });
    }),
  fixClientCode: () =>
    subscribe('fixClientCode', async (published) => {
      await addSystemBubbleOnce(published, 'fixing_client_code');

      const localGit = await localGitRepo.getFiles(published.app, 'deus/client-failure-types');
      customAssert(published.bubble.type === 'github', 'エラーならロジック修正必須');

      const failedStep = await githubEventRepo.findFailedStepOrThrow(
        published.app,
        published.bubble.content
      );
      const gitDiff = await llmRepo.fixClient(published.app, localGit, failedStep);

      await localGitRepo.pushToRemoteOrThrow(published.app, localGit, gitDiff, 'deus/test-client');
      await githubUseCase.addGitBubble(published.app, 'deus/test-client', gitDiff);

      await transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.complete(event));
      });
    }),
  fixServerCode: () =>
    subscribe('fixServerCode', async (published) => {
      await addSystemBubbleOnce(published, 'fixing_server_code');

      const localGit = await localGitRepo.getFiles(published.app, 'deus/server-failure-types');
      customAssert(published.bubble.type === 'github', 'エラーならロジック修正必須');

      const failedStep = await githubEventRepo.findFailedStepOrThrow(
        published.app,
        published.bubble.content
      );
      const gitDiff = await llmRepo.fixServer(published.app, localGit, failedStep);

      await localGitRepo.pushToRemoteOrThrow(published.app, localGit, gitDiff, 'deus/test-server');
      await githubUseCase.addGitBubble(published.app, 'deus/test-server', gitDiff);

      await transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.complete(event));
      });
    }),
};
