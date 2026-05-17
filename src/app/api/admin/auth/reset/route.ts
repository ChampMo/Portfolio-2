import { NextResponse } from 'next/server';
import {
  clearSessionCookie,
  getAuthDoc,
  hashPasscode,
  setSessionCookie,
} from '@/lib/auth/admin';

export async function POST(request: Request) {
  try {
    const { resetToken, newPasscode } = await request.json();

    if (typeof resetToken !== 'string' || !resetToken) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
    }
    if (
      typeof newPasscode !== 'string' ||
      newPasscode.length < 6 ||
      newPasscode.length > 64
    ) {
      return NextResponse.json(
        { error: 'invalid_passcode', detail: 'ความยาว 6-64 ตัวอักษร' },
        { status: 400 }
      );
    }

    const doc = await getAuthDoc();
    if (
      !doc.resetToken ||
      !doc.resetTokenExpiresAt ||
      new Date(doc.resetTokenExpiresAt).getTime() < Date.now()
    ) {
      return NextResponse.json({ error: 'token_expired' }, { status: 400 });
    }
    if (doc.resetToken !== resetToken) {
      return NextResponse.json({ error: 'token_mismatch' }, { status: 401 });
    }

    const { hash, salt } = hashPasscode(newPasscode);
    doc.passcodeHash = hash;
    doc.passcodeSalt = salt;
    doc.resetToken = '';
    doc.resetTokenExpiresAt = null;
    doc.sessionVersion = (doc.sessionVersion || 1) + 1; // invalidate sessions เดิม
    doc.lastLoginAt = new Date();
    await doc.save();

    // ออก session ใหม่ให้ตัวเองเลย
    await clearSessionCookie();
    await setSessionCookie(doc.sessionVersion);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[ADMIN AUTH RESET ERROR]', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
