import server from '$/$server';
import { appUseCase } from '$/domain/app/useCase/appUseCase';
import { API_BASE_PATH, CORS_ORIGIN } from '$/service/envValues';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import etag from '@fastify/etag';
import helmet from '@fastify/helmet';
import type { FastifyServerFactory } from 'fastify';
import Fastify from 'fastify';

export const initServer = (serverFactory?: FastifyServerFactory) => {
  const app = Fastify({ serverFactory });
  app.register(helmet);
  app.register(etag, { weak: true });
  app.register(cors, { origin: CORS_ORIGIN, credentials: true });
  app.register(cookie);
  server(app, { basePath: API_BASE_PATH });

  return app;
};

export const init = (serverFactory?: FastifyServerFactory) => {
  appUseCase.initOneByOne();
  appUseCase.watchBubbleContents();

  return initServer(serverFactory);
};
