import Pusher from 'pusher';

let _instance: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!_instance) {
    _instance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return _instance;
}
