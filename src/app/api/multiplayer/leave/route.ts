import { NextResponse } from 'next/server';
import { getPusherServer } from '@/lib/pusher/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const pusher = getPusherServer();
    await pusher.trigger('multiplayer-radar', 'player:leave', { sessionId });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[MULTIPLAYER LEAVE ERROR]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
