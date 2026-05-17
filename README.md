This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Admin Authentication

หน้า `/admin` ทุกหน้าจะถูกครอบด้วย `AdminAuthGate` ก่อนเสมอ ผู้ดูแลต้องกรอก *Officer Passcode* ก่อนเข้าใช้งาน

### Env vars ที่ต้องตั้ง (`.env.local`)

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Admin auth — ใช้เซ็น session/OTP (อย่างน้อย 16 ตัวอักษร แนะนำสุ่มยาว ๆ)
ADMIN_AUTH_SECRET=replace-with-long-random-string

# (ออปชัน) รหัสตั้งต้นครั้งแรก ถ้ายังไม่เคยตั้ง — ระบบจะ seed ให้อัตโนมัติ
# ถ้าไม่ตั้ง: รหัสที่กรอกใน login ครั้งแรกจะถูกใช้เป็นรหัสเริ่มต้นแทน
ADMIN_INITIAL_PASSCODE=changeme123

# SMTP สำหรับส่ง OTP ไปที่ sonesambidev@gmail.com
# ตัวอย่าง: ใช้ Gmail App Password (https://myaccount.google.com/apppasswords)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-sender@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="Cosmic Voyager <your-sender@gmail.com>"
```

### Flow

1. เข้า `/admin` → เจอหน้า authorization (ครอบทุก sub-route)
2. กรอกรหัสถูก → ออก cookie `admin_session` (HMAC-signed, อายุ 8 ชม.)
3. ลืมรหัส / เปลี่ยนรหัส → กดปุ่ม "ลืมรหัส / เปลี่ยนรหัส"
   - ระบบส่ง OTP 6 หลัก (อายุ **5 นาที**) ไปที่ `sonesambidev@gmail.com`
   - กรอก OTP → ออก reset token (อายุ 10 นาที)
   - ตั้งรหัสใหม่ → invalidate session เก่าทั้งหมด + login ให้อัตโนมัติ
4. ปุ่ม **LOGOUT OFFICER** ใน sidebar เคลียร์ cookie ทันที

### หมายเหตุความปลอดภัย

- รหัสเก็บใน MongoDB ในรูป **scrypt hash + salt** (collection `adminauths`)
- OTP เก็บเป็น **SHA-256 hash** ห้ามแก้รหัสตัวจริงเป็น plain text
- จำกัด attempts OTP สูงสุด 5 ครั้ง / cooldown ขอใหม่ 30 วิ
- ถ้าต้องการบังคับให้ทุก device ออกจากระบบ → เปลี่ยนรหัสใหม่ (ระบบจะเพิ่ม `sessionVersion`)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
