import type { JOB_STATUSES } from '../commonConstantsWithClient';
import type { DisplayId, JobId, TaskId, UserId } from './branded';

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

export type JobStatus = (typeof JOB_STATUSES)[number];

export type JobBase = {
  id: JobId;
  displayId: DisplayId;
  title: string;
  prompt: string;
  status: JobStatus;
  createdTimestamp: number;
};

export type ProdJobModel = JobBase & { mode: 'prod' };
export type TestJobModel = JobBase & { mode: 'test' };
export type JobModel = ProdJobModel | TestJobModel;
export type CreateJobParams = { title: string; prompt: string };
