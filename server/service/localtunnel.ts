import localtunnel from 'localtunnel';
import { setTimeout } from 'timers/promises';
import { API_ORIGIN, IS_LOCALHOST } from './envValues';

let tunnel: localtunnel.Tunnel | null = null;

export const getApiOriginOrLocaltunnelUrl = () => {
  if (!IS_LOCALHOST) return API_ORIGIN;

  return tunnel?.url ?? 'http://tunnel-error.localhost';
};

export const connectLocaltunnelIfLocal = async (handlers: { onReconnect: () => void }) => {
  if (!IS_LOCALHOST) return;

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
