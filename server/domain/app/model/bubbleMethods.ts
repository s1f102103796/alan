import type { BubbleModel, SystemStatus, TaskModel } from '$/commonTypesWithClient/bubbleModels';
import { type GHActionModel, type RWDeploymentModel } from '$/commonTypesWithClient/bubbleModels';
import { bubbleIdParser } from '$/commonTypesWithClient/idParsers';
import { randomUUID } from 'crypto';

export const bubbleMethods = {
  createSystem: (content: SystemStatus, createdTime: number): BubbleModel => {
    return { id: bubbleIdParser.parse(randomUUID()), type: 'system', content, createdTime };
  },
  createGitHub: (content: GHActionModel): BubbleModel => {
    return {
      id: bubbleIdParser.parse(randomUUID()),
      type: 'github',
      content,
      createdTime: content.createdTime,
    };
  },
  createRailway: (content: RWDeploymentModel): BubbleModel => {
    return {
      id: bubbleIdParser.parse(randomUUID()),
      type: 'railway',
      content,
      createdTime: content.createdTime,
    };
  },
  createTaskList: (content: TaskModel[]): BubbleModel => {
    return {
      id: bubbleIdParser.parse(randomUUID()),
      type: 'taskList',
      content,
      createdTime: Date.now(),
    };
  },
  createAiOrHuman: (type: 'ai' | 'human', content: string, createdTime: number): BubbleModel => {
    return { id: bubbleIdParser.parse(randomUUID()), type, content, createdTime };
  },
};
