import { FIREBASE_SERVER_KEY } from '$/service/envValues';
import { githubApiClient } from '$/service/githubApiClient';
import { railwayClient } from '$/service/railwayClient';
import { gql } from '@apollo/client';
import { defineController } from './$relay';

export default defineController(() => ({
  post: async ({ body }) => {
    const owner = 'deus-ai-org';
    const repoName = `deus-${Date.now()}`;
    await githubApiClient.repos
      ._owner(owner)
      ._repo('deus-template')
      .generate.$post({ body: { owner, name: repoName, include_all_branches: true } });

    await githubApiClient.repos
      ._owner(owner)
      ._repo(repoName)
      .actions.variables.$post({
        body: { name: 'API_ORIGIN', value: `https://${repoName}-production.up.railway.app` },
      });

    await githubApiClient.repos
      ._owner(owner)
      ._repo(repoName)
      .pages.$post({ body: { build_type: 'legacy', source: { branch: 'gh-pages' } } });

    const res1 = await railwayClient
      .mutate({
        mutation: gql`
          mutation Mutation($name: String!) {
            projectCreate(input: { name: $name, plugins: ["postgresql"] }) {
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
        variables: { repoUrl: `${owner}/${repoName}`, projectId },
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
          origin: `https://${owner}.github.io`,
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
          repo: `${owner}/${repoName}`,
        },
      })
      .catch((e) => e.message);
    console.log(22, res6);

    return { status: 200, body: res3 };
  },
}));
