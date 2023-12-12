import type { AppId, DisplayId, GitHubId, UserId } from './branded';
import type { BubbleModel } from './bubbleModels';

export const APP_STATUSES = ['waiting', 'running', 'failure', 'success', 'closed'] as const;

export type UserModel = {
  id: UserId;
  githubId: GitHubId;
  email: string;
  displayName: string | undefined;
  photoURL: string | undefined;
};

export type RailwayModel = {
  url: string;
  environmentId: string;
  projectId: string;
  serviceId: string;
};

export type AppModelBase = {
  id: AppId;
  userId: UserId;
  index: number;
  displayId: DisplayId;
  name: string;
  createdTime: number;
  statusUpdatedTime: number;
  bubblesUpdatedTime: number;
  urls: { site: string; github: string; vscode: string };
  bubbles: BubbleModel[];
};

export type WaitingAppModel = AppModelBase & {
  status: (typeof APP_STATUSES)[0];
  waitingOrder: number;
  railway?: undefined;
};

export type ActiveAppModel = AppModelBase & {
  status: 'running' | 'failure' | 'success' | 'closed';
  waitingOrder?: undefined;
  railway: RailwayModel;
};

export type AppModel = WaitingAppModel | ActiveAppModel;
