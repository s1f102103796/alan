import api from '$/githubApi/$api';
import { GITHUB_TOKEN } from '$/service/envValues';
import aspida from '@aspida/fetch';

export const githubApiClient = api(
  aspida(undefined, { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }, throwHttpErrors: true })
);
