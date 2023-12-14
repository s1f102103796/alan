import type { AppModel } from 'commonTypesWithClient/appModels';
import type { GHActionModel, RWDeploymentModel } from 'commonTypesWithClient/bubbleModels';
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

// eslint-disable-next-line complexity
export const deploymentStatusToIconStatus = (deployment: RWDeploymentModel): AppModel['status'] => {
  switch (deployment.status) {
    case 'QUEUED':
    case 'WAITING':
      return 'waiting';
    case 'BUILDING':
    case 'DEPLOYING':
    case 'INITIALIZING':
    case 'REMOVING':
      return 'running';
    case 'CRASHED':
    case 'FAILED':
    case 'REMOVED':
    case 'SKIPPED':
      return 'failure';
    case 'SUCCESS':
      return 'success';
    default:
      throw new Error(deployment.status satisfies never);
  }
};

export const useAppStatus = (app: AppModel) =>
  useMemo(() => {
    if (app.status !== 'running') return app.status;

    const latestStatus = app.bubbles
      .flatMap((b) =>
        b.type === 'railway'
          ? deploymentStatusToIconStatus(b.content)
          : b.type === 'github'
          ? actionStatusToIconStatus(b.content)
          : []
      )
      .at(-1);

    return latestStatus ?? app.status;
  }, [app]);
