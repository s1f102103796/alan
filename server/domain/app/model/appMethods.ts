import { FIRST_QUESTION } from '$/commonConstantsWithClient';
import type {
  ActiveAppModel,
  AppModel,
  RailwayModel,
  UserModel,
  WaitingAppModel,
} from '$/commonTypesWithClient/appModels';
import type { GHActionModel } from '$/commonTypesWithClient/bubbleModels';
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
      bubbles: [bubbleMethods.create('ai', FIRST_QUESTION), bubbleMethods.create('human', desc)],
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
  upsertGitHubBubbles: (app: AppModel, contents: GHActionModel[]): AppModel => {
    const newContentIds = contents.flatMap((c) =>
      app.bubbles.every((b) => b.type !== 'github' || b.content.id !== c.id) ? c.id : []
    );

    return {
      ...app,
      bubbles: [
        ...app.bubbles.map((b) => {
          if (b.type !== 'github') return b;

          const existingContent = contents.find((c) => c.id === b.content.id);

          return existingContent === undefined ? b : { ...b, content: existingContent };
        }),
        ...contents
          .filter((c) => newContentIds.includes(c.id))
          .sort((a, b) => a.createdTime - b.createdTime)
          .map((content) => bubbleMethods.create('github', content)),
      ],
      bubblesUpdatedTime: Date.now(),
    };
  },
};
