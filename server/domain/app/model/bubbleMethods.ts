import type {
  BubbleModel,
  GHActionModel,
  RWDeploymentModel,
} from '$/commonTypesWithClient/bubbleModels';
import { bubbleIdParser } from '$/service/idParsers';
import { customAssert } from '$/service/returnStatus';
import { randomUUID } from 'crypto';

export const bubbleMethods = {
  create: (
    type: BubbleModel['type'],
    content: string | GHActionModel | RWDeploymentModel
  ): BubbleModel => {
    const id = bubbleIdParser.parse(randomUUID());

    if (type === 'github') {
      customAssert(
        typeof content !== 'string' && content.model === 'github',
        'エラーならロジック修正必須'
      );

      return { id, type, content, createdTime: content.createdTime };
    }

    if (type === 'railway') {
      customAssert(
        typeof content !== 'string' && content.model === 'railway',
        'エラーならロジック修正必須'
      );

      return { id, type, content, createdTime: content.createdTime };
    }

    customAssert(typeof content === 'string', 'エラーならロジック修正必須');

    return { id, type, content, createdTime: Date.now() };
  },
};
