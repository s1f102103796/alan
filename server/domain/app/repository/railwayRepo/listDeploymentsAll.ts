import type { ActiveAppModel } from '$/commonTypesWithClient/appModels';
import type { RWDeploymentId } from '$/commonTypesWithClient/branded';
import type { RWDeploymentModel, RWStatus } from '$/commonTypesWithClient/bubbleModels';
import { parseRWDeployment } from '$/commonTypesWithClient/bubbleModels';
import { railwayClient } from '$/service/railwayClient';
import { customAssert } from '$/service/returnStatus';
import { gql } from '@apollo/client';
import { displayIdToApiOrigin, toBranchUrl, toCommitUrl, toRWDeployUrl } from '../../query/utils';
import { localGitRepo } from '../localGitRepo';

export const listDeploymentsAllOnRailwayRepo = async (app: ActiveAppModel) => {
  const list: RWDeploymentModel[] = [];
  let after: string | undefined = undefined;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res: {
      data: {
        deployments: {
          edges: {
            node: {
              id: RWDeploymentId;
              createdAt: string;
              status: RWStatus;
              // サードパーティーには提供されてなさそう
              // meta: {
              //   branch: string;
              //   commitHash: string;
              //   commitAuthor: string;
              //   commitMessage: string;
              // };
            };
          }[];
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string;
          };
        };
      };
    } | null = await railwayClient
      .query({
        query: gql`
          query Query($serviceId: String!, $after: String) {
            deployments(input: { serviceId: $serviceId }, after: $after) {
              edges {
                node {
                  id
                  createdAt
                  status
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        `,
        variables: { serviceId: app.railway.serviceId, after },
      })
      .catch((e) => {
        console.log(e.stack);
        return null;
      });

    if (res === null) break;

    const gitLogs = await localGitRepo.getLogs(app, 'main');
    const deployments = await Promise.all(
      res.data.deployments.edges.map(async ({ node }) => {
        const createdTime = new Date(node.createdAt).getTime();
        const commitLog = gitLogs.find((log) => new Date(log.date).getTime() < createdTime);
        customAssert(commitLog, 'エラーならロジック修正必須');
        const oldBubble = app.bubbles.flatMap((b) =>
          b.type === 'railway' && b.content.id === node.id ? b : []
        )[0];

        const status =
          oldBubble?.content.status !== 'SUCCESS' && node.status === 'SUCCESS'
            ? await fetch(`${displayIdToApiOrigin(app.displayId)}/api/health`)
                .then((res) => (res.status === 200 ? ('SUCCESS' as const) : ('DEPLOYING' as const)))
                .catch(() => 'DEPLOYING' as const)
            : node.status;

        return parseRWDeployment({
          id: node.id,
          title: commitLog.message,
          status,
          url: toRWDeployUrl({
            project: app.railway.projectId,
            service: app.railway.serviceId,
            deployment: node.id,
          }),
          branchUrl: toBranchUrl(app.displayId, 'main'),
          commitId: commitLog.hash,
          commitUrl: toCommitUrl(app.displayId, commitLog.hash),
          createdTime,
          updatedTime:
            oldBubble === undefined || oldBubble.content.status !== node.status
              ? Date.now()
              : oldBubble.content.updatedTime,
        });
      })
    );

    list.push(...deployments);

    if (!res.data.deployments.pageInfo.hasNextPage) break;

    after = res.data.deployments.pageInfo.endCursor;
  }

  return list;
};
