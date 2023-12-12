import type { BubbleModel, GHActionModel } from '$/commonTypesWithClient/bubbleModels';
import { bubbleIdParser } from '$/service/idParsers';
import { customAssert } from '$/service/returnStatus';
import { randomUUID } from 'crypto';

export const bubbleMethods = {
  create: (type: BubbleModel['type'], content: string | GHActionModel): BubbleModel => {
    const id = bubbleIdParser.parse(randomUUID());

    if (type === 'github') {
      customAssert(typeof content !== 'string', 'エラーならロジック修正必須');

      return { id, type, content, createdTime: content.createdTime };
    }

    customAssert(typeof content === 'string', 'エラーならロジック修正必須');

    return { id, type, content, createdTime: Date.now() };
  },
};
