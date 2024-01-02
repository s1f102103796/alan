import { createOnRailwayRepo } from './create';
import { listDeploymentsAllOnRailwayRepo } from './listDeploymentsAll';

export const railwayRepo = {
  create: createOnRailwayRepo,
  listDeploymentsAll: listDeploymentsAllOnRailwayRepo,
};
