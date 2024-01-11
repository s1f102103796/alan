import { railwayRepo } from '$/domain/app/repository/railwayRepo';
import { appUseCase } from '$/domain/app/useCase/appUseCase';
import { transaction } from '$/service/prismaClient';
import { customAssert } from '$/service/returnStatus';
import { setTimeout } from 'timers/promises';
import type { AppEventModel } from '../model/appEventModels';
import { appEventMethods } from '../model/appEventModels';
import { appEventQuery } from '../query/appEventQuery';
import { appEventRepo } from '../repository/appEventRepo';

export const railwayEventUseCase = {
  watchDeployments: async (published: AppEventModel) => {
    customAssert(published.app.status !== 'waiting', 'エラーならロジック修正必須');

    if (published.app.railway === undefined) {
      await transaction('RepeatableRead', async (tx) => {
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.complete(event));
      });
      return;
    }

    let isStillRunning = true;

    for (let i = 0; i < 100; i += 1) {
      const list = await railwayRepo.listDeploymentsAll(published.app, published.app.railway);

      await appUseCase.updateRWDeployments(published.app.id, list);

      isStillRunning = list.some((deployment) => deployment.status.endsWith('ING'));

      if (!isStillRunning) break;

      await setTimeout(5000);
    }

    await transaction('RepeatableRead', async (tx) => {
      const event = await appEventQuery.findByIdOrThrow(tx, published.id);
      await appEventRepo.save(
        tx,
        isStillRunning ? appEventMethods.fail(event) : appEventMethods.complete(event)
      );
    });
  },
};
