import { NextResponse } from 'next/server';
import {
  RESET_TOKEN_TTL_MS,
  generateResetToken,
  getAuthDoc,
  hashOtp,
} from '@/lib/auth/admin';

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  try {
    const { otp } = await request.json();
    if (typeof otp !== 'string' || !/^\d{4,8}$/.test(otp)) {
      return NextResponse.json({ error: 'invalid_otp' }, { status: 400 });
    }

    const doc = await getAuthDoc();
    if (!doc.otpHash || !doc.otpExpiresAt) {
      return NextResponse.json({ error: 'no_otp' }, { status: 400 });
    }
    if (new Date(doc.otpExpiresAt).getTime() < Date.now()) {
      doc.otpHash = '';
      doc.otpExpiresAt = null;
      doc.otpAttempts = 0;
      await doc.save();
      return NextResponse.json({ error: 'otp_expired' }, { status: 400 });
    }
    if (doc.otpAttempts >= MAX_ATTEMPTS) {
      doc.otpHash = '';
      doc.otpExpiresAt = null;
      doc.otpAttempts = 0;
      await doc.save();
      return NextResponse.json({ error: 'too_many_attempts' }, { status: 429 });
    }

    if (hashOtp(otp) !== doc.otpHash) {
      doc.otpAttempts += 1;
      await doc.save();
      return NextResponse.json(
        { error: 'wrong_otp', remaining: MAX_ATTEMPTS - doc.otpAttempts },
        { status: 401 }
      );
    }

    // OTP ถูก → ออก reset token
    const token = generateResetToken();
    doc.resetToken = token;
    doc.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    // เผา OTP ทิ้ง (ใช้ครั้งเดียว)
    doc.otpHash = '';
    doc.otpExpiresAt = null;
    doc.otpAttempts = 0;
    await doc.save();

    return NextResponse.json({
      ok: true,
      resetToken: token,
      expiresInSec: Math.round(RESET_TOKEN_TTL_MS / 1000),
    });
  } catch (e) {
    console.error('[ADMIN AUTH VERIFY-OTP ERROR]', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
