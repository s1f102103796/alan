import localtunnel from 'localtunnel';
import { API_ORIGIN } from './envValues';
import { customAssert } from './returnStatus';

const isLocal = API_ORIGIN.startsWith('http://localhost');
let tunnel: localtunnel.Tunnel | null = null;

export const getApiOriginOrLocaltunnelUrl = () => {
  if (!isLocal) return API_ORIGIN;

  customAssert(tunnel, 'エラーならロジック修正必須');

  return tunnel.url;
};

export const connectLocaltunnelIfLocal = async (handlers: { onReconnect: () => void }) => {
  if (!isLocal) return;

  tunnel = await localtunnel({ port: +new URL(API_ORIGIN).port });
  tunnel.on('close', async () => {
    await connectLocaltunnelIfLocal(handlers);
    handlers.onReconnect();
  });

  console.log('localtunnel: ', tunnel.url);
};
