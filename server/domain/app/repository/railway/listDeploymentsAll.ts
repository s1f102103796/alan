import type { ActiveAppModel } from '$/commonTypesWithClient/appModels';
import type { RWDeploymentId } from '$/commonTypesWithClient/branded';
import type { RWDeploymentModel, RWStatus } from '$/commonTypesWithClient/bubbleModels';
import { parseRWDeployment } from '$/commonTypesWithClient/bubbleModels';
import { railwayClient } from '$/service/railwayClient';
import { customAssert } from '$/service/returnStatus';
import { gql } from '@apollo/client';
import type { Prisma } from '@prisma/client';
import { toBranchUrl, toCommitUrl, toRWDeployUrl } from '../../query/utils';

export const listDeploymentsAllOnRailwayRepo = async (
  tx: Prisma.TransactionClient,
  app: ActiveAppModel
) => {
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
        console.log(e.message);
        return null;
      });

    if (res === null) break;

    list.push(
      ...res.data.deployments.edges.map(({ node }) => {
        const createdTime = new Date(node.createdAt).getTime();
        const nearestGitHub = app.bubbles
          .flatMap((b) =>
            b.type === 'github' && b.content.type === 'Deploy client' && b.createdTime < createdTime
              ? b
              : []
          )
          .at(-1);
        const oldBubble = app.bubbles.flatMap((b) =>
          b.type === 'railway' && b.content.id === node.id ? b : []
        )[0];

        customAssert(nearestGitHub, 'エラーならロジック修正必須');

        return parseRWDeployment({
          id: node.id,
          title: nearestGitHub.content.title,
          status: node.status,
          url: toRWDeployUrl({
            project: app.railway.projectId,
            service: app.railway.serviceId,
            deployment: node.id,
          }),
          branch: nearestGitHub.content.branch,
          branchUrl: toBranchUrl(app.displayId, nearestGitHub.content.branch),
          commitId: nearestGitHub.content.commitId,
          commitUrl: toCommitUrl(app.displayId, nearestGitHub.content.commitId),
          createdTime,
          updatedTime:
            oldBubble === undefined || oldBubble.content.status !== node.status
              ? Date.now()
              : oldBubble.content.updatedTime,
        });
      })
    );

    if (!res.data.deployments.pageInfo.hasNextPage) break;

    after = res.data.deployments.pageInfo.endCursor;
  }

  return list;
};
