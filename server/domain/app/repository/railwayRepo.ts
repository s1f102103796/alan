import type { RailwayModel, WaitingAppModel } from '$/commonTypesWithClient/appModels';
import { FIREBASE_SERVER_KEY, GITHUB_OWNER } from '$/service/envValues';
import { railwayClient } from '$/service/railwayClient';
import { gql } from '@apollo/client';

export const railwayRepo = {
  create: async (app: WaitingAppModel): Promise<RailwayModel> => {
    const repoName = app.displayId;
    const res1 = await railwayClient
      .mutate({
        mutation: gql`
          mutation Mutation($name: String!) {
            projectCreate(input: { name: $name, plugins: ["postgresql"], isPublic: true }) {
              environments {
                edges {
                  node {
                    id
                    name
                  }
                }
              }
              id
            }
          }
        `,
        variables: { name: repoName },
      })
      .catch((e) => e.message);
    const projectId = res1.data.projectCreate.id;
    const environmentId = res1.data.projectCreate.environments.edges[0].node.id;
    console.log(repoName, res1.data.projectCreate.environments.edges[0].node);
    const res2 = await railwayClient
      .mutate({
        mutation: gql`
          mutation Mutation($repoUrl: String!, $projectId: String!) {
            githubRepoDeploy(input: { repo: $repoUrl, projectId: $projectId })
          }
        `,
        variables: { repoUrl: `${GITHUB_OWNER}/${repoName}`, projectId },
      })
      .catch((e) => e.message);
    console.log(res2);
    const pj = await railwayClient.query({
      query: gql`
        query Query($projectId: String!) {
          project(id: $projectId) {
            services {
              edges {
                node {
                  id
                  name
                }
              }
            }
          }
        }
      `,
      variables: { projectId },
    });
    const serviceId = pj.data.project.services.edges[0].node.id;
    console.log(pj);
    const res3 = await railwayClient
      .mutate({
        mutation: gql`
          mutation Mutation(
            $environmentId: String!
            $projectId: String!
            $serviceId: String!
            $origin: String!
            $firebase: String!
          ) {
            variableCollectionUpsert(
              input: {
                environmentId: $environmentId
                projectId: $projectId
                serviceId: $serviceId
                variables: {
                  API_DATABASE_URL: "\${{Postgres.DATABASE_URL}}"
                  API_BASE_PATH: "/api"
                  CORS_ORIGIN: $origin
                  FIREBASE_SERVER_KEY: $firebase
                }
              }
            )
          }
        `,
        variables: {
          environmentId,
          projectId,
          serviceId,
          origin: `https://${GITHUB_OWNER}.github.io`,
          firebase: FIREBASE_SERVER_KEY,
        },
      })
      .catch((e) => e.message);
    console.log(res3);
    const res4 = await railwayClient
      .mutate({
        mutation: gql`
          mutation Mutation($environmentId: String!, $serviceId: String!) {
            serviceDomainCreate(input: { environmentId: $environmentId, serviceId: $serviceId }) {
              domain
            }
          }
        `,
        variables: { environmentId, serviceId },
      })
      .catch((e) => e.message);
    console.log(res4);
    const res5 = await railwayClient
      .mutate({
        mutation: gql`
          mutation Mutation($serviceId: String!) {
            serviceInstanceUpdate(
              serviceId: $serviceId
              input: {
                healthcheckPath: "/api/health"
                rootDirectory: "/server"
                watchPatterns: ["/server/**"]
              }
            )
          }
        `,
        variables: { serviceId },
      })
      .catch((e) => e.message);
    console.log(11, res5);

    const res6 = await railwayClient
      .mutate({
        mutation: gql`
          mutation Mutation(
            $environmentId: String!
            $projectId: String!
            $serviceId: String!
            $repo: String!
          ) {
            deploymentTriggerCreate(
              input: {
                branch: "main"
                checkSuites: true
                environmentId: $environmentId
                projectId: $projectId
                serviceId: $serviceId
                provider: "node"
                repository: $repo
              }
            ) {
              id
            }
          }
        `,
        variables: {
          environmentId,
          projectId,
          serviceId,
          repo: `${GITHUB_OWNER}/${repoName}`,
        },
      })
      .catch((e) => e.message);
    console.log(22, res6);

    return { environmentId, projectId, serviceId };
  },
};
