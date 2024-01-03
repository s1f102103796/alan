import type { AppModel } from '$/commonTypesWithClient/appModels';
import { railwayRepo } from '$/domain/app/repository/railwayRepo';
import { appUseCase } from '$/domain/app/useCase/appUseCase';
import { githubUseCase } from '$/domain/app/useCase/githubUseCase';
import { githubEventRepo } from '$/domain/appEvent/repository/githubEventRepo';
import { transaction } from '$/service/prismaClient';
import { customAssert } from '$/service/returnStatus';
import type { Prisma } from '@prisma/client';
import type {
  AppEventDispatcher,
  AppEventModel,
  AppEventType,
  SubscriberId,
} from '../model/appEventModels';
import { appEventMethods, appSubscriberDict } from '../model/appEventModels';
import { appEventQuery } from '../query/appEventQuery';
import { appEventRepo } from '../repository/appEventRepo';
import { railwayEventUseCase } from './railwayEventUseCase';

const subscribingDict: Record<SubscriberId, boolean> = {
  createGitHub: false,
  createRailway: false,
  startDevelopment: false,
  watchRailway: false,
  watchRailwayOnce: false,
};

const subscribe = async (
  subscriberId: SubscriberId,
  cb: (published: AppEventModel) => Promise<void>
) => {
  if (subscribingDict[subscriberId]) return;
  subscribingDict[subscriberId] = true;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const published = await transaction('RepeatableRead', async (tx) => {
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
    });

    if (published === null) break;

    await cb(published).catch(() =>
      transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.fail(event));
      })
    );
  }

  subscribingDict[subscriberId] = false;
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
  callWhenServerStarted: async () => {
    await transaction('RepeatableRead', async (tx) => {
      const events = await appEventQuery.listByStatus(tx, 'published');
      await Promise.all(events.map((event) => appEventRepo.save(tx, appEventMethods.fail(event))));
    });

    appEventUseCase.createGitHub();
    appEventUseCase.createRailway();
    appEventUseCase.watchRailway();
    appEventUseCase.startDevelopment();
  },
  createGitHub: () =>
    subscribe('createGitHub', async (published) => {
      if (published.app.status !== 'waiting') return;

      customAssert(published.app.status === 'waiting', 'エラーならロジック修正必須');

      await appUseCase.init(published.app.id).then(githubEventRepo.create);

      const { dispatchAfterTransaction } = await transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.complete(event));

        customAssert(event.app.status === 'init', 'エラーならロジック修正必須');

        return await githubUseCase.completeGitHubInit(tx, event.app);
      });

      dispatchAfterTransaction();
    }),
  createRailway: () =>
    subscribe('createRailway', async (published) => {
      customAssert(published.app.status === 'init', 'エラーならロジック修正必須');

      const railway = await railwayRepo.create(published.app);
      const { dispatchAfterTransaction } = await transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.complete(event));

        customAssert(event.app.status === 'init', 'エラーならロジック修正必須');
        return await appUseCase.completeRailwayInit(tx, event.app, railway);
      });

      dispatchAfterTransaction();
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
  startDevelopment: () =>
    subscribe('startDevelopment', async (published) => {
      await githubEventRepo.develop(published.app);
      await transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.complete(event));
      });
    }),
};
