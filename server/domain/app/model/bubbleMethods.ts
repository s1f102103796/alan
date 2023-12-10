import type { BubbleModel } from '$/commonTypesWithClient/appModels';
import { bubbleIdParser } from '$/service/idParsers';
import { randomUUID } from 'crypto';

export const bubbleMethods = {
  create: (type: BubbleModel['type'], content: string): BubbleModel => ({
    id: bubbleIdParser.parse(randomUUID()),
    type,
    content,
    createdTime: Date.now(),
  }),
};
