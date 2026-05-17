import { NextResponse } from 'next/server';
import {
  ADMIN_EMAIL,
  OTP_TTL_MS,
  generateOtp,
  getAuthDoc,
  hashOtp,
} from '@/lib/auth/admin';
import { sendOtpEmail } from '@/lib/auth/mailer';

// rate limit: ออก OTP ใหม่ได้ทุก 30 วิ
const RESEND_COOLDOWN_MS = 30 * 1000;

export async function POST() {
  try {
    const doc = await getAuthDoc();

    // ถ้ามี OTP ที่ยังใช้ได้ + เพิ่งออกไม่ถึง cooldown → กันสแปม
    if (doc.otpExpiresAt && doc.otpExpiresAt instanceof Date) {
      const issuedAt =
        doc.otpExpiresAt.getTime() - OTP_TTL_MS;
      if (Date.now() - issuedAt < RESEND_COOLDOWN_MS) {
        const wait = Math.ceil(
          (RESEND_COOLDOWN_MS - (Date.now() - issuedAt)) / 1000
        );
        return NextResponse.json(
          { error: 'cooldown', retryAfterSec: wait },
          { status: 429 }
        );
      }
    }

    const otp = generateOtp();
    doc.otpHash = hashOtp(otp);
    doc.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    doc.otpAttempts = 0;
    // ยกเลิก reset token เก่า ถ้ามี
    doc.resetToken = '';
    doc.resetTokenExpiresAt = null;
    await doc.save();

    await sendOtpEmail(otp, Math.round(OTP_TTL_MS / 60000));

    return NextResponse.json({
      ok: true,
      sentTo: ADMIN_EMAIL.replace(/(.{2}).+(@.+)/, '$1•••$2'),
      expiresInSec: Math.round(OTP_TTL_MS / 1000),
    });
  } catch (e: any) {
    console.error('[ADMIN AUTH REQUEST-OTP ERROR]', e);
    return NextResponse.json(
      { error: 'send_failed', detail: e?.message ?? 'unknown' },
      { status: 500 }
    );
  }
}
