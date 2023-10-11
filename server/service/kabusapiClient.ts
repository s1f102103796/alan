import aspida from '@aspida/fetch';
import WebSocket from 'ws';
import api from '../api/$api';
import { KABUSAPI_PORT } from './envValues';

export const kabusapiClient = api(
  aspida(undefined, { baseURL: `http://localhost:${KABUSAPI_PORT}/kabusapi` })
);

let wsClient: WebSocket | undefined;

export const kabuswsClient = (): WebSocket => {
  wsClient ??= new WebSocket(`ws://localhost:${KABUSAPI_PORT}/kabusapi/websocket`);

  return wsClient;
};
