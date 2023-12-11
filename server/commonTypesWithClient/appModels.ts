import type { AppId, BubbleId, DisplayId, GitHubId, UserId } from './branded';

export const APP_STATUSES = ['waiting', 'running', 'failure', 'success', 'closed'] as const;
export const BUBBLE_TYPES = ['ai', 'human', 'job'] as const;

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

export type BubbleModel = {
  id: BubbleId;
  type: (typeof BUBBLE_TYPES)[number];
  content: string;
  createdTime: number;
};

export type AppModelBase = {
  id: AppId;
  userId: UserId;
  index: number;
  displayId: DisplayId;
  name: string;
  createdTime: number;
  statusUpdatedTime: number;
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
