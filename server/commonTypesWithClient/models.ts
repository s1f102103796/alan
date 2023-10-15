import type { CLAUDE_MODEL_IDS, JOB_STATUSES } from '../commonConstantsWithClient';
import type { ChatLogId, DisplayId, JobId } from './branded';

export type JobStatus = (typeof JOB_STATUSES)[number];

export type ChatLogModel = { id: ChatLogId; modelId: ClaudeModelId; timestamp: number } & (
  | { status: 'loading'; s3?: undefined }
  | { status: 'success'; s3: { Key: string; tokenCount: { input: number; output: number } } }
  | { status: 'failure'; s3: { Key: string; tokenCount?: undefined } }
);

export type JobBase = {
  id: JobId;
  displayId: DisplayId;
  title: string;
  prompt: string;
  status: JobStatus;
  timestamp: number;
  chatLog: ChatLogModel;
};

export type ProdJobModel = JobBase & { mode: 'prod' };
export type TestJobModel = JobBase & { mode: 'test' };
export type JobModel = ProdJobModel | TestJobModel;
export type CreateJobParams = { title: string; prompt: string };

export type ClaudeModelId = (typeof CLAUDE_MODEL_IDS)[number];
