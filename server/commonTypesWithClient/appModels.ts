import type { AppId, DisplayId, GHUserId, UserId } from './branded';
import type { BubbleModel, TaskModel } from './bubbleModels';

export const APP_STATUSES = ['waiting', 'init', 'running', 'failure', 'success', 'closed'] as const;

export type UserModel = {
  id: UserId;
  githubId: GHUserId;
  email: string;
  displayName: string | undefined;
  photoURL: string | undefined;
  createdTime: number;
};

export type RailwayModel = {
  url: string;
  environmentId: string;
  projectId: string;
  serviceId: string;
};

export type AppModelBase = {
  id: AppId;
  author: { userId: UserId; githubId: string; name: string; photoURL: string | undefined };
  index: number;
  displayId: DisplayId;
  name: string;
  similarName: string;
  createdTime: number;
  bubbles: BubbleModel[];
};

export type WaitingAppModel = AppModelBase & {
  status: (typeof APP_STATUSES)[0];
  waitingOrder: number;
  urls?: undefined;
  ogpImage?: undefined;
  railway?: undefined;
  taskList?: undefined;
};

export type OgpImage = { url: string; s3Key: string; name: string; prompt: string };

export type InitAppModel = AppModelBase & {
  status: (typeof APP_STATUSES)[1];
  waitingOrder?: undefined;
  urls?: undefined;
  ogpImage?: OgpImage;
  railway?: RailwayModel;
  taskList?: TaskModel[];
};

export type ActiveAppModel = AppModelBase & {
  status: 'running' | 'failure' | 'success' | 'closed';
  waitingOrder?: undefined;
  urls?: { site: string; github: string; vscode: string };
  ogpImage: OgpImage;
  railway: RailwayModel;
  taskList: TaskModel[];
};

export type AppModel = WaitingAppModel | InitAppModel | ActiveAppModel;
