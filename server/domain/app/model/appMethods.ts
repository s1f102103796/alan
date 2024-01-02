import type {
  ActiveAppModel,
  AppModel,
  InitAppModel,
  RailwayModel,
  UserModel,
  WaitingAppModel,
} from '$/commonTypesWithClient/appModels';
import type {
  BubbleModel,
  GHActionModel,
  RWDeploymentModel,
} from '$/commonTypesWithClient/bubbleModels';
import { appIdParser } from '$/service/idParsers';
import { randomUUID } from 'crypto';
import { indexToDisplayId, indexToUrls } from '../query/utils';
import { bubbleMethods } from './bubbleMethods';

export const appMethods = {
  create: (user: UserModel, appCount: number, waitingAppCount: number, desc: string): AppModel => {
    const id = appIdParser.parse(randomUUID());
    const index = appCount + 1;
    const now = Date.now();

    return {
      id,
      author: {
        userId: user.id,
        githubId: user.githubId,
        name: user.displayName ?? user.githubId,
        photoURL: user.photoURL,
      },
      index,
      displayId: indexToDisplayId(index),
      name: desc.slice(0, 15),
      createdTime: now,
      githubUpdatedTime: 0,
      railwayUpdatedTime: 0,
      bubbles: [
        bubbleMethods.createSystem('first_question', now),
        bubbleMethods.createAiOrHuman('human', desc, now + 1),
        ...(waitingAppCount === 0 ? [] : [bubbleMethods.createSystem('waiting_init', now + 2)]),
      ],
      status: 'waiting',
      waitingOrder: waitingAppCount + 1,
    };
  },
  init: (app: WaitingAppModel): InitAppModel => {
    return {
      ...app,
      status: 'init',
      waitingOrder: undefined,
      bubbles: [...app.bubbles, bubbleMethods.createSystem('init_infra', Date.now())],
    };
  },
  run: (app: InitAppModel, railway: RailwayModel): ActiveAppModel => {
    return {
      ...app,
      status: 'running',
      urls: indexToUrls(app.index),
      railway,
      waitingOrder: undefined,
    };
  },
  retry: (app: ActiveAppModel): ActiveAppModel => {
    return {
      ...app,
      bubbles: [...app.bubbles, bubbleMethods.createSystem('retry_test', Date.now())],
    };
  },
  addBubble: <T extends AppModel>(app: T, bubble: BubbleModel): T => {
    return { ...app, bubbles: [...app.bubbles, bubble] };
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
        ...contents.filter((c) => newContentIds.includes(c.id)).map(bubbleMethods.createGitHub),
      ],
      githubUpdatedTime: Date.now(),
    };
  },
  upsertRailwayBubbles: (app: AppModel, contents: RWDeploymentModel[]): AppModel => {
    const newContentIds = contents.flatMap((c) =>
      app.bubbles.every((b) => b.type !== 'railway' || b.content.id !== c.id) ? c.id : []
    );

    return {
      ...app,
      bubbles: [
        ...app.bubbles.map((b) => {
          if (b.type !== 'railway') return b;

          const existingContent = contents.find((c) => c.id === b.content.id);

          return existingContent === undefined ? b : { ...b, content: existingContent };
        }),
        ...contents.filter((c) => newContentIds.includes(c.id)).map(bubbleMethods.createRailway),
      ],
      railwayUpdatedTime: Date.now(),
    };
  },
};
