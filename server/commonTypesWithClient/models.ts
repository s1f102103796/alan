import type { JobId, TaskId, UserId } from './branded';

export type UserModel = {
  id: UserId;
  email: string;
  displayName: string | undefined;
  photoURL: string | undefined;
};

export type TaskModel = {
  id: TaskId;
  label: string;
  done: boolean;
  created: number;
};

export type JobStatus = 'ready' | 'running' | 'stopped' | 'archived';

export type JobModel = {
  id: JobId;
  status: JobStatus;
  description: string;
  createdTimestamp: number;
};
