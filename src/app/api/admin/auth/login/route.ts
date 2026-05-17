import { NextResponse } from 'next/server';
import {
  getAuthDoc,
  hashPasscode,
  setSessionCookie,
  verifyPasscode,
} from '@/lib/auth/admin';

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json();
    if (typeof passcode !== 'string' || passcode.length < 4) {
      return NextResponse.json(
        { error: 'invalid_passcode' },
        { status: 400 }
      );
    }

    const doc = await getAuthDoc();

    // กรณีไม่มีรหัสในระบบเลย และไม่มี seed ENV → ตั้งรหัสครั้งแรกจากการ login
    if (!doc.passcodeHash) {
      const { hash, salt } = hashPasscode(passcode);
      doc.passcodeHash = hash;
      doc.passcodeSalt = salt;
      doc.lastLoginAt = new Date();
      await doc.save();
      await setSessionCookie(doc.sessionVersion);
      return NextResponse.json({ ok: true, initialized: true });
    }

    const ok = verifyPasscode(passcode, doc.passcodeSalt, doc.passcodeHash);
    if (!ok) {
      return NextResponse.json(
        { error: 'wrong_passcode' },
        { status: 401 }
      );
    }

    doc.lastLoginAt = new Date();
    await doc.save();
    await setSessionCookie(doc.sessionVersion);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[ADMIN AUTH LOGIN ERROR]', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
