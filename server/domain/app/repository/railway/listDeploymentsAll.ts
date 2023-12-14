import type { ActiveAppModel } from '$/commonTypesWithClient/appModels';
import type { RWDeploymentId } from '$/commonTypesWithClient/branded';
import type { RWDeploymentModel, RWStatus } from '$/commonTypesWithClient/bubbleModels';
import { parseRWDeployment } from '$/commonTypesWithClient/bubbleModels';
import { railwayClient } from '$/service/railwayClient';
import { gql } from '@apollo/client';
import { toRWDeployUrl } from '../../query/appQuery';

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
        console.log(e.message);
        return null;
      });

    if (res === null) break;

    list.push(
      ...res.data.deployments.edges.map(({ node }) =>
        parseRWDeployment({
          id: node.id,
          title: 'node.meta.commitMessage',
          status: node.status,
          url: toRWDeployUrl({
            project: app.railway.projectId,
            service: app.railway.serviceId,
            deployment: node.id,
          }),
          branch: 'node.meta.branch',
          commitId: 'node.meta.commitHash',
          createdTime: new Date(node.createdAt).getTime(),
          updatedTime: new Date(node.createdAt).getTime(),
        })
      )
    );

    if (!res.data.deployments.pageInfo.hasNextPage) break;

    after = res.data.deployments.pageInfo.endCursor;
  }

  return list;
};
