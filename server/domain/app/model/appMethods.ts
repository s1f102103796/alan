import type {
  ActiveAppModel,
  AppModel,
  RailwayModel,
  UserModel,
  WaitingAppModel,
} from '$/commonTypesWithClient/appModels';
import type { BubbleModel, GHActionModel } from '$/commonTypesWithClient/bubbleModels';
import { appIdParser } from '$/service/idParsers';
import { randomUUID } from 'crypto';
import { indexToDisplayId, indexToUrls } from '../query/appQuery';
import { bubbleMethods } from './bubbleMethods';

export const appMethods = {
  create: (user: UserModel, appCount: number, waitingAppCount: number, desc: string): AppModel => {
    const id = appIdParser.parse(randomUUID());
    const index = appCount + 1;
    const now = Date.now();

    return {
      id,
      userId: user.id,
      index,
      displayId: indexToDisplayId(index),
      name: desc.slice(0, 10),
      createdTime: now,
      statusUpdatedTime: now,
      bubblesUpdatedTime: now,
      bubbles: [bubbleMethods.create('human', desc)],
      status: 'waiting',
      waitingOrder: waitingAppCount + 1,
      urls: indexToUrls(index),
    };
  },
  init: (app: WaitingAppModel, railway: RailwayModel): ActiveAppModel => {
    return {
      ...app,
      status: 'running',
      railway,
      waitingOrder: undefined,
      statusUpdatedTime: Date.now(),
    };
  },
  addBubbles: (
    app: AppModel,
    data: { type: BubbleModel['type']; content: string | GHActionModel }[]
  ): AppModel => {
    return {
      ...app,
      bubbles: [
        ...app.bubbles,
        ...data.map(({ type, content }) => bubbleMethods.create(type, content)),
      ],
      bubblesUpdatedTime: Date.now(),
    };
  },
};
