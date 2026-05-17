import { cookies } from 'next/headers';
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import AdminAuth from '@/models/AdminAuth';

export const SESSION_COOKIE = 'admin_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 ชม.
export const OTP_TTL_MS = 5 * 60 * 1000; // 5 นาที
export const RESET_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 นาที (ใช้ต่อหลัง verify OTP)
export const ADMIN_EMAIL = 'sonesambidev@gmail.com';

function getSecret(): string {
  const s = process.env.ADMIN_AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      'ADMIN_AUTH_SECRET env is missing or too short (>= 16 chars required)'
    );
  }
  return s;
}

// ───── passcode hashing (scrypt) ─────
export function hashPasscode(passcode: string, salt?: string) {
  const useSalt = salt ?? randomBytes(16).toString('hex');
  const derived = scryptSync(passcode, useSalt, 64).toString('hex');
  return { hash: derived, salt: useSalt };
}

export function verifyPasscode(passcode: string, salt: string, hash: string) {
  if (!salt || !hash) return false;
  const derived = scryptSync(passcode, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

// ───── OTP ─────
export function generateOtp(): string {
  // 6-digit, zero-padded
  const n = randomBytes(3).readUIntBE(0, 3) % 1_000_000;
  return n.toString().padStart(6, '0');
}

export function hashOtp(otp: string): string {
  return createHash('sha256').update(`${otp}:${getSecret()}`).digest('hex');
}

// ───── reset token ─────
export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

// ───── session token (HMAC) ─────
type SessionPayload = { v: number; exp: number };

function b64urlEncode(buf: Buffer | string) {
  return Buffer.from(buf as any)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
function b64urlDecode(s: string): Buffer {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

export function signSession(payload: SessionPayload): string {
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = b64urlEncode(
    createHmac('sha256', getSecret()).update(body).digest()
  );
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expectedSig = b64urlEncode(
    createHmac('sha256', getSecret()).update(body).digest()
  );
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body).toString('utf8')) as SessionPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ───── DB singleton ─────
export async function getAuthDoc() {
  await connectToDatabase();
  let doc = await AdminAuth.findOne({ key: 'main' });
  if (!doc) {
    doc = await AdminAuth.create({ key: 'main' });
  }
  // ถ้ายังไม่ตั้งรหัส และมี ENV สำหรับ seed → seed ครั้งแรก
  if (!doc.passcodeHash && process.env.ADMIN_INITIAL_PASSCODE) {
    const { hash, salt } = hashPasscode(process.env.ADMIN_INITIAL_PASSCODE);
    doc.passcodeHash = hash;
    doc.passcodeSalt = salt;
    await doc.save();
  }
  return doc;
}

// ───── cookie helpers ─────
export async function setSessionCookie(version: number) {
  const exp = Date.now() + SESSION_TTL_SECONDS * 1000;
  const token = signSession({ v: version, exp });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function readSessionPayload() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function isAuthenticated(): Promise<boolean> {
  const payload = await readSessionPayload();
  if (!payload) return false;
  const doc = await getAuthDoc();
  return payload.v === doc.sessionVersion && !!doc.passcodeHash;
}
