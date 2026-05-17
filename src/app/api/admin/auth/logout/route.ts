import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/admin';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
