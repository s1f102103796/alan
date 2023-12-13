import type { AppModel } from 'commonTypesWithClient/appModels';
import type { GHActionModel } from 'commonTypesWithClient/bubbleModels';
import { useMemo } from 'react';

// eslint-disable-next-line complexity
export const actionStatusToIconStatus = (action: GHActionModel): AppModel['status'] => {
  switch (action.status) {
    case 'in_progress':
      return 'running';
    case 'cancelled':
    case 'failure':
    case 'timed_out':
      return 'failure';
    case 'completed':
    case 'skipped':
    case 'stale':
    case 'success':
      return 'success';
    case 'action_required':
    case 'neutral':
    case 'pending':
    case 'queued':
    case 'requested':
    case 'waiting':
      return 'waiting';
    default:
      throw new Error(action.status satisfies never);
  }
};

export const useAppStatus = (app: AppModel) =>
  useMemo(() => {
    if (app.status !== 'running') return app.status;

    const latestGithubBubble = app.bubbles.flatMap((b) => (b.type === 'github' ? b : [])).at(-1);

    return latestGithubBubble === undefined
      ? app.status
      : actionStatusToIconStatus(latestGithubBubble.content);
  }, [app]);
