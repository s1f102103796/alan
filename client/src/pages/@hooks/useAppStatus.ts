import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { GHActionModel, RWDeploymentModel } from '$/commonTypesWithClient/bubbleModels';
import { useMemo } from 'react';

// eslint-disable-next-line complexity
export const actionConclusionToIconStatus = (action: GHActionModel): AppModel['status'] => {
  switch (action.conclusion) {
    case null:
      return 'running';
    case 'cancelled':
    case 'failure':
    case 'timed_out':
      return 'failure';
    case 'skipped':
    case 'stale':
    case 'success':
      return 'success';
    case 'action_required':
    case 'neutral':
      return 'waiting';
    default:
      throw new Error(action.conclusion satisfies never);
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

export const useAppStatus = (app: AppModel): AppModel['status'] =>
  useMemo(() => {
    if (app.status !== 'running') return app.status;

    const statuses = app.bubbles.flatMap((b) =>
      b.type === 'railway'
        ? deploymentStatusToIconStatus(b.content)
        : b.type === 'github'
        ? actionConclusionToIconStatus(b.content)
        : []
    );

    return statuses.some((s) => s === 'running') ? 'running' : statuses.at(-1) ?? app.status;
  }, [app]);
