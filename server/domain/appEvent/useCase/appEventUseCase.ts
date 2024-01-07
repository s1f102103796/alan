import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { LocalGitFile } from '$/domain/app/repository/localGitRepo';
import { localGitRepo } from '$/domain/app/repository/localGitRepo';
import { railwayRepo } from '$/domain/app/repository/railwayRepo';
import { appUseCase } from '$/domain/app/useCase/appUseCase';
import { githubUseCase } from '$/domain/app/useCase/githubUseCase';
import { githubEventRepo } from '$/domain/appEvent/repository/githubEventRepo';
import { listFiles } from '$/service/listFiles';
import { transaction } from '$/service/prismaClient';
import { customAssert } from '$/service/returnStatus';
import type { Prisma } from '@prisma/client';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import openapi2aspida from 'openapi2aspida';
import { tmpdir } from 'os';
import { join } from 'path';
import type { AppEventDispatcher, AppEventType } from '../model/appEventModels';
import { appEventMethods, appSubscriberDict } from '../model/appEventModels';
import { appEventQuery } from '../query/appEventQuery';
import { appEventRepo } from '../repository/appEventRepo';
import { llmRepo, sources } from '../repository/llmRepo';
import { railwayEventUseCase } from './railwayEventUseCase';
import { subscribe } from './subscribe';

export const appEventUseCase = {
  create: async (
    tx: Prisma.TransactionClient,
    type: AppEventType,
    app: AppModel
  ): Promise<AppEventDispatcher> => {
    const events = appEventMethods.create(type, app);
    await Promise.all(events.map((ev) => appEventRepo.save(tx, ev)));

    return {
      dispatchAfterTransaction: () => {
        const subs = appSubscriberDict()[type];
        events.forEach((ev) => subs.find((sub) => sub.id === ev.subscriberId)?.fn());
      },
    };
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
    appEventUseCase.fixClientCode();
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
      await appUseCase.addSystemBubbleIfNotExists(published.app.id, 'creating_schema');
      await githubEventRepo.createSchema(published.app);
      await transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.complete(event));

        return await appEventUseCase.create(tx, 'SchemaCreated', event.app);
      }).then(({ dispatchAfterTransaction }) => dispatchAfterTransaction());
    }),
  createApiDef: () =>
    subscribe('createApiDefinition', async (published) => {
      await appUseCase.addSystemBubbleIfNotExists(published.app.id, 'creating_api_def');
      await githubEventRepo.createApiDef(published.app);
      await transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.complete(event));

        return await appEventUseCase.create(tx, 'ApiDefined', event.app);
      }).then(({ dispatchAfterTransaction }) => dispatchAfterTransaction());
    }),
  createClientCode: () =>
    subscribe('createClientCode', async (published) => {
      await appUseCase.addSystemBubbleIfNotExists(published.app.id, 'creating_client_code');
      const openapi = await localGitRepo.fetchRemoteFileOrThrow(
        published.app,
        'deus/api-definition',
        sources.openapi
      );
      const localGit = await localGitRepo.getFiles(published.app, 'deus/test-client');
      const tmpApiDir = join(tmpdir(), published.app.displayId);
      if (!existsSync(tmpApiDir)) mkdirSync(tmpApiDir);

      const openapiPath = join(tmpApiDir, 'openapi.json');
      writeFileSync(openapiPath, openapi.content, 'utf8');
      const outputDir = join(tmpApiDir, 'server/api');
      if (existsSync(outputDir)) rmSync(outputDir, { recursive: true, force: true }); // エラーで残ることがあるのをopenapi2aspidaのために空にしておく

      await Promise.all(
        openapi2aspida({
          input: outputDir,
          openapi: { inputFile: openapiPath, yaml: false, outputDir },
        })
      );

      const newApiDir = listFiles(outputDir).map(
        (file): LocalGitFile => ({
          source: file.replace(tmpApiDir, ''),
          content: readFileSync(file, 'utf8'),
        })
      );

      rmSync(tmpApiDir, { recursive: true, force: true });

      const gitDiff = await llmRepo.initClient(published.app, localGit, newApiDir);

      await localGitRepo.pushToRemoteOrThrow(published.app, localGit, gitDiff, 'deus/test-client');
      await githubUseCase.addGitBubble(published.app, 'deus/test-client', gitDiff);

      await transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.complete(event));
      });
    }),
  fixClientCode: () =>
    subscribe('fixClientCode', async (published) => {
      await appUseCase.addSystemBubble(published.app.id, 'fixing_client_code');

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
};
