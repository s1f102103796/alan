import type { InitAppModel, RailwayModel } from '$/commonTypesWithClient/appModels';
import {
  GITHUB_OWNER,
  S3_ACCESS_KEY,
  S3_BUCKET,
  S3_CUSTOM_ENDPOINT,
  S3_ENDPOINT,
  S3_REGION,
  S3_SECRET_KEY,
  SUPABASE_JWT_SECRET,
} from '$/service/envValues';
import { railwayClient } from '$/service/railwayClient';
import { gql } from '@apollo/client';
import { indexToUrls, projectIdToUrl } from '../../query/utils';

export const createOnRailwayRepo = async (app: InitAppModel): Promise<RailwayModel> => {
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

  await railwayClient
    .mutate({
      mutation: gql`
        mutation Mutation($repoUrl: String!, $projectId: String!) {
          githubRepoDeploy(input: { repo: $repoUrl, projectId: $projectId })
        }
      `,
      variables: { repoUrl: `${GITHUB_OWNER}/${repoName}`, projectId },
    })
    .catch((e) => e.message);

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
  const urls = indexToUrls(app.index);

  await railwayClient.mutate({
    mutation: gql`
      mutation Mutation(
        $environmentId: String!
        $projectId: String!
        $serviceId: String!
        $origin: String!
        $supabase: String!
        $s3Endpoint: String!
        $s3Bucket: String!
        $s3AccessKey: String!
        $s3SecretKey: String!
        $s3Region: String!
        $s3CustomEndpoint: String!
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
              SUPABASE_JWT_SECRET: $supabase
              S3_ENDPOINT: $s3Endpoint
              S3_BUCKET: $s3Bucket
              S3_ACCESS_KEY: $s3AccessKey
              S3_SECRET_KEY: $s3SecretKey
              S3_REGION: $s3Region
              S3_CUSTOM_ENDPOINT: $s3CustomEndpoint
            }
          }
        )
      }
    `,
    variables: {
      environmentId,
      projectId,
      serviceId,
      origin: urls.site,
      supabase: SUPABASE_JWT_SECRET,
      s3Endpoint: S3_ENDPOINT,
      s3Bucket: S3_BUCKET,
      s3AccessKey: S3_ACCESS_KEY,
      s3SecretKey: S3_SECRET_KEY,
      s3Region: S3_REGION,
      s3CustomEndpoint: S3_CUSTOM_ENDPOINT,
    },
  });

  await railwayClient.mutate({
    mutation: gql`
      mutation Mutation($environmentId: String!, $serviceId: String!) {
        serviceDomainCreate(input: { environmentId: $environmentId, serviceId: $serviceId }) {
          domain
        }
      }
    `,
    variables: { environmentId, serviceId },
  });

  await railwayClient.mutate({
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
  });

  await railwayClient.mutate({
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
  });

  return { url: projectIdToUrl(projectId), environmentId, projectId, serviceId };
};
