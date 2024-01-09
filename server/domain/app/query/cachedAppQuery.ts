import type { AppModel } from '$/commonTypesWithClient/appModels';
import { prismaClient } from '$/service/prismaClient';
import { appQuery } from './appQuery';

let cachedAllApps: AppModel[] | null = null;
let prevTime = 0;

export const cachedAppQuery = {
  findAll: async () => {
    const now = Date.now();

    if (cachedAllApps && now - prevTime < 5000) return cachedAllApps;

    prevTime = now;
    const apps = await appQuery.findAll(prismaClient);
    cachedAllApps = apps;

    return apps;
  },
};
