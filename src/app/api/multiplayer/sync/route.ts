import { NextResponse } from 'next/server';
import { getPusherServer } from '@/lib/pusher/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { sessionId, callsign, planet, colorIndex } = await request.json();
    if (!sessionId || !callsign) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pusher = getPusherServer();
    await pusher.trigger('multiplayer-radar', 'player:update', {
      sessionId,
      callsign: String(callsign).slice(0, 16),
      planet: planet || '/',
      colorIndex: typeof colorIndex === 'number' ? Math.max(0, Math.floor(colorIndex)) : 0,
      timestamp: Date.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[MULTIPLAYER SYNC ERROR]', err);
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
  }
}
