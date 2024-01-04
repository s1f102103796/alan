import localtunnel from 'localtunnel';
import { setTimeout } from 'timers/promises';
import { API_ORIGIN } from './envValues';

const isLocal = API_ORIGIN.startsWith('http://localhost');
let tunnel: localtunnel.Tunnel | null = null;

export const getApiOriginOrLocaltunnelUrl = () => {
  if (!isLocal) return API_ORIGIN;

  return tunnel?.url ?? 'http://tunnel-error.localhost';
};

export const connectLocaltunnelIfLocal = async (handlers: { onReconnect: () => void }) => {
  if (!isLocal) return;

  tunnel = await localtunnel({ port: +new URL(API_ORIGIN).port }).catch((e) => {
    console.log('tunnel connecting error:', e.message);
    return null;
  });

  if (tunnel === null) return;

  tunnel.on('error', async (e) => {
    console.log('tunnel error:', e.message);

    await setTimeout(5000);
    await connectLocaltunnelIfLocal(handlers);
    handlers.onReconnect();
  });

  tunnel.on('close', async () => {
    await connectLocaltunnelIfLocal(handlers);
    handlers.onReconnect();
  });

  console.log('localtunnel: ', tunnel.url);
};
