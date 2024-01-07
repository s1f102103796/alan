import { transaction } from '$/service/prismaClient';
import type { AppEventModel, SubscriberId } from '../model/appEventModels';
import { appEventMethods } from '../model/appEventModels';
import { appEventQuery } from '../query/appEventQuery';
import { appEventRepo } from '../repository/appEventRepo';

const subscribingDict: { [key in SubscriberId]?: boolean } = {};

export const subscribe = async (
  subscriberId: SubscriberId,
  cb: (published: AppEventModel) => Promise<void>
) => {
  if (subscribingDict[subscriberId] === true) return;
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

    await cb(published).catch((e) =>
      transaction('RepeatableRead', async (tx) => {
        console.log(subscriberId, e.stack);
        const event = await appEventQuery.findByIdOrThrow(tx, published.id);
        await appEventRepo.save(tx, appEventMethods.fail(event));
      })
    );
  }

  subscribingDict[subscriberId] = false;
};
