import { NextResponse } from 'next/server';
import { getAuthDoc, isAuthenticated } from '@/lib/auth/admin';

export async function GET() {
  try {
    const doc = await getAuthDoc();
    const authed = await isAuthenticated();
    return NextResponse.json({
      authenticated: authed,
      hasPasscode: !!doc.passcodeHash,
    });
  } catch (e) {
    console.error('[ADMIN AUTH SESSION ERROR]', e);
    return NextResponse.json(
      { authenticated: false, hasPasscode: false, error: 'session_error' },
      { status: 500 }
    );
  }
}
