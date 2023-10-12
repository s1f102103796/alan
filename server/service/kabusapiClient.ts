import aspida from '@aspida/fetch';
import WebSocket from 'ws';
import api from '../api/$api';

const PROD_PORT = 18080;
const TEST_PORT = 18081;

export const kabusapiClient = {
  prod: api(aspida(undefined, { baseURL: `http://localhost:${PROD_PORT}/kabusapi` })),
  test: api(aspida(undefined, { baseURL: `http://localhost:${TEST_PORT}/kabusapi` })),
};

let wsProdClient: WebSocket | undefined;
let wsTestClient: WebSocket | undefined;

export const kabuswsClient = {
  prod: (): WebSocket => {
    wsProdClient ??= new WebSocket(`ws://localhost:${PROD_PORT}/kabusapi/websocket`);

    return wsProdClient;
  },
  test: (): WebSocket => {
    wsTestClient ??= new WebSocket(`ws://localhost:${TEST_PORT}/kabusapi/websocket`);

    return wsTestClient;
  },
};
