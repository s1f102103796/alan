import type { AppModel } from '$/commonTypesWithClient/appModels';
import { type UserModel } from '$/commonTypesWithClient/appModels';
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
  initOneByOne: async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const startTime = Date.now();
      const waiting = await appQuery.findWaitingHead(prismaClient);

      if (waiting === undefined) {
        await setTimeout(startTime + 5_000 - Date.now());
        continue;
      }

      await githubRepo.create(waiting);
      const railway = await railwayRepo.create(waiting);
      const app = appMethods.init(waiting, railway);

      await appRepo.save(prismaClient, app);
      await setTimeout(startTime + 30_000 - Date.now());
    }
  },
};
