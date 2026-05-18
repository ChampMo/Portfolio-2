import Pusher from 'pusher-js';

let _client: Pusher | null = null;

export function getPusherClient(): Pusher | null {
  if (typeof window === 'undefined') return null;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) return null;
  if (!_client) {
    _client = new Pusher(key, { cluster });
  }
  return _client;
}
