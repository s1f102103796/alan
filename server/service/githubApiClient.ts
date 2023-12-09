import aspida from '@aspida/fetch';
import api from '../githubApi/$api';
import { GITHUB_TOKEN } from './envValues';

export const githubApiClient = api(
  aspida(undefined, { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } })
);
