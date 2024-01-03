import type { AppModel } from '$/commonTypesWithClient/appModels';
import { llmRepo } from '$/domain/app/repository/llmRepo';
import { localGitRepo } from '$/domain/app/repository/localGitRepo';
import { railwayRepo } from '$/domain/app/repository/railwayRepo';
import { appUseCase } from '$/domain/app/useCase/appUseCase';
import { githubUseCase } from '$/domain/app/useCase/githubUseCase';
import { githubEventRepo } from '$/domain/appEvent/repository/githubEventRepo';
import { transaction } from '$/service/prismaClient';
import { customAssert } from '$/service/returnStatus';
import type { Prisma } from '@prisma/client';
import type { AppEventDispatcher, AppEventType, SubscriberId } from '../model/appEventModels';
import { appEventMethods, appSubscriberDict } from '../model/appEventModels';
import { appEventQuery } from '../query/appEventQuery';
import { appEventRepo } from '../repository/appEventRepo';

let isCreatingGitHub = false;
let isCreatingRailway = false;
let isStartingDevelopment = false;

const subscribe = async (tx: Prisma.TransactionClient, subscriberId: SubscriberId) => {
  const failed = await appEventQuery.findHead(tx, subscriberId, 'failed');

  if (failed !== null) {
    const published = appEventMethods.publish(failed);
    await appEventRepo.save(tx, published);

    return published;
  }

  const waiting = await appEventQuery.findHead(tx, subscriberId, 'waiting');

  if (waiting === null) return null;

  const published = appEventMethods.publish(waiting);
  await appEventRepo.save(tx, published);

  return published;
};

const develop = async (app: AppModel) => {
  const localGit = await localGitRepo.getFiles(app);
  const gitDiff = await llmRepo.initApp(app, localGit);

  if (gitDiff === null) return;

  await localGitRepo.pushToRemote(app, gitDiff);
  await githubUseCase.pushedGitDiff(app, gitDiff);
};

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
  callWhenServerStarted: () => {
    appEventUseCase.createGitHub();
    appEventUseCase.createRailway();
    appEventUseCase.startDevelopment();
  },
  createGitHub: async () => {
    if (isCreatingGitHub) return;
    isCreatingGitHub = true;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const published = await transaction('RepeatableRead', async (tx) => {
        const published = await subscribe(tx, 'createGitHub');

        if (published === null) return null;

        if (published.app.status !== 'waiting') return published;

        customAssert(published.app.status === 'waiting', 'エラーならロジック修正必須');

        const inited = await appUseCase.init(tx, published.app);
        return { ...published, app: inited };
      });

      if (published === null) break;

      customAssert(published.app.status === 'init', 'エラーならロジック修正必須');

      await githubEventRepo
        .create(published.app)
        .then(() =>
          transaction('RepeatableRead', async (tx) => {
            const event = await appEventQuery.findByIdOrThrow(tx, published.id);
            await appEventRepo.save(tx, appEventMethods.complete(event));

            customAssert(event.app.status === 'init', 'エラーならロジック修正必須');

            return await githubUseCase.completeGitHubInit(tx, event.app);
          }).then(({ dispatchAfterTransaction }) => dispatchAfterTransaction())
        )
        .catch(() =>
          transaction('RepeatableRead', async (tx) => {
            const event = await appEventQuery.findByIdOrThrow(tx, published.id);
            await appEventRepo.save(tx, appEventMethods.fail(event));
          })
        );
    }

    isCreatingGitHub = false;
  },
  createRailway: async () => {
    if (isCreatingRailway) return;
    isCreatingRailway = true;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const published = await transaction('RepeatableRead', (tx) => subscribe(tx, 'createRailway'));

      if (published === null) break;

      customAssert(published.app.status === 'init', 'エラーならロジック修正必須');

      await railwayRepo
        .create(published.app)
        .then((railway) =>
          transaction('RepeatableRead', async (tx) => {
            const event = await appEventQuery.findByIdOrThrow(tx, published.id);
            await appEventRepo.save(tx, appEventMethods.complete(event));

            customAssert(event.app.status === 'init', 'エラーならロジック修正必須');
            return await appUseCase.completeRailwayInit(tx, event.app, railway);
          })
        )
        .then(({ dispatchAfterTransaction }) => dispatchAfterTransaction())
        .catch(() =>
          transaction('RepeatableRead', async (tx) => {
            const event = await appEventQuery.findByIdOrThrow(tx, published.id);
            await appEventRepo.save(tx, appEventMethods.fail(event));
          })
        );
    }

    isCreatingRailway = false;
  },
  startDevelopment: async () => {
    if (isStartingDevelopment) return;
    isStartingDevelopment = true;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const published = await transaction('RepeatableRead', (tx) =>
        subscribe(tx, 'startDevelopment')
      );

      if (published === null) break;

      await develop(published.app)
        .then(() =>
          transaction('RepeatableRead', async (tx) => {
            const event = await appEventQuery.findByIdOrThrow(tx, published.id);
            await appEventRepo.save(tx, appEventMethods.complete(event));
          })
        )
        .catch(() =>
          transaction('RepeatableRead', async (tx) => {
            const event = await appEventQuery.findByIdOrThrow(tx, published.id);
            await appEventRepo.save(tx, appEventMethods.fail(event));
          })
        );
    }

    isStartingDevelopment = false;
  },
};
