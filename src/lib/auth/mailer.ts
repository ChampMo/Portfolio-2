import nodemailer from 'nodemailer';
import { ADMIN_EMAIL } from './admin';

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'SMTP env missing (SMTP_HOST / SMTP_USER / SMTP_PASS required)'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendOtpEmail(otp: string, ttlMinutes = 5) {
  const transporter = buildTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;

  const html = `
    <div style="font-family:ui-monospace,Menlo,Consolas,monospace;background:#020617;padding:32px;color:#e2e8f0;">
      <div style="max-width:480px;margin:0 auto;border:1px solid rgba(34,211,238,0.3);background:rgba(8,47,73,0.4);border-radius:6px;padding:32px;">
        <p style="letter-spacing:0.3em;color:#22d3ee;font-size:11px;margin:0 0 8px 0;">COSMIC VOYAGER // ADMIN</p>
        <h1 style="margin:0 0 24px 0;font-family:Georgia,serif;color:#fff;font-size:22px;">Passcode Reset OTP</h1>
        <p style="margin:0 0 16px 0;font-size:13px;color:#94a3b8;">ใช้รหัสด้านล่างเพื่อยืนยันการเปลี่ยนรหัสเจ้าหน้าที่ รหัสนี้จะหมดอายุภายใน <b>${ttlMinutes} นาที</b></p>
        <div style="text-align:center;margin:24px 0;">
          <span style="display:inline-block;font-size:34px;letter-spacing:14px;color:#67e8f9;background:#0f172a;border:1px solid rgba(34,211,238,0.4);padding:16px 24px;border-radius:4px;">${otp}</span>
        </div>
        <p style="margin:0;font-size:11px;color:#64748b;">หากคุณไม่ได้เป็นผู้ร้องขอ กรุณาเพิกเฉยต่ออีเมลนี้</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: ADMIN_EMAIL,
    subject: `[Cosmic Voyager] Admin OTP: ${otp}`,
    text: `รหัส OTP สำหรับเปลี่ยนรหัสเจ้าหน้าที่: ${otp}\nหมดอายุใน ${ttlMinutes} นาที`,
    html,
  });
}
