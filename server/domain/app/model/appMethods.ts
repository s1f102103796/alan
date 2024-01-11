import type {
  ActiveAppModel,
  AppModel,
  InitAppModel,
  OgpImage,
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
import { z } from 'zod';
import { indexToDisplayId, indexToUrls } from '../query/utils';
import { bubbleMethods } from './bubbleMethods';

export const appMethods = {
  create: (
    user: UserModel,
    appCount: number,
    waitingAppCount: number,
    name: string,
    similarName: string
  ): AppModel => {
    const id = appIdParser.parse(randomUUID());
    const index = appCount + 1;
    const now = Date.now();
    z.string().min(1).max(30).parse(name);
    z.string().min(1).max(30).parse(similarName);

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
      name,
      similarName,
      createdTime: now,
      bubbles: [
        bubbleMethods.createSystem('first_question', now),
        bubbleMethods.createAiOrHuman(
          'human',
          `アプリ名: ${name}\n類似サービス: ${similarName}`,
          now + 1
        ),
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
  setOgp: (app: InitAppModel, ogpImage: OgpImage): InitAppModel => ({ ...app, ogpImage }),
  setRailway: (app: InitAppModel, railway: RailwayModel): InitAppModel => ({ ...app, railway }),
  run: (app: InitAppModel, ogpImage: OgpImage, railway: RailwayModel): ActiveAppModel => {
    return {
      ...app,
      status: 'running',
      urls: indexToUrls(app.index),
      ogpImage,
      railway,
      waitingOrder: undefined,
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
    };
  },
};
