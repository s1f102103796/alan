import { createOnRailwayRepo } from './railway/create';
import { listDeploymentsAllOnRailwayRepo } from './railway/listDeploymentsAll';

export const railwayRepo = {
  create: createOnRailwayRepo,
  listDeploymentsAll: listDeploymentsAllOnRailwayRepo,
};
