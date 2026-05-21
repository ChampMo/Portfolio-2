'use client';

import { useEffect, useRef, useState, useCallback, ReactNode, FormEvent } from 'react';
import { ShieldCheck, KeyRound, Mail, Lock, ArrowLeft, Hexagon, Loader2, Eye } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useAppStore } from '@/lib/store/useAppStore';
import { audioManager } from '@/lib/audio/audioManager';
import { useSfx } from '@/hooks/useSfx';

type Stage = 'loading' | 'login' | 'request-otp' | 'enter-otp' | 'reset' | 'authed';

export default function AdminAuthGate({ children }: { children: ReactNode }) {
  const { isViewMode, setViewMode } = useAdmin();
  const setAdminAuthed = useAppStore((s) => s.setAdminAuthed);
  const { playSettingClick } = useSfx();
  const alertedRef = useRef(false);
  const [stage, setStage] = useState<Stage>('loading');
  const [hasPasscode, setHasPasscode] = useState(false);

  // form state
  const [passcode, setPasscode] = useState('');
  const [otp, setOtp] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // ── ตรวจสถานะ session เริ่มต้น ──
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth/session', { cache: 'no-store' });
      const data = await res.json();
      setHasPasscode(!!data.hasPasscode);
      setStage(data.authenticated ? 'authed' : 'login');
    } catch {
      setStage('login');
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // ── นาฬิกานับเวลา OTP ──
  useEffect(() => {
    if (stage !== 'enter-otp' || !otpExpiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [stage, otpExpiresAt]);

  // Play alert once when auth gate first appears (stage leaves 'loading')
  useEffect(() => {
    if (stage !== 'loading' && stage !== 'authed' && !alertedRef.current) {
      alertedRef.current = true;
      audioManager.playSfx('alert');
    }
  }, [stage]);

  // Notify store when authenticated so SoundManagerInit can start adminbgm
  useEffect(() => {
    if (stage === 'authed') setAdminAuthed(true);
  }, [stage, setAdminAuthed]);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  // ── login ──
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!passcode) return setError('กรุณากรอกรหัส');
    setBusy(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'wrong_passcode') setError('รหัสไม่ถูกต้อง');
        else if (data.error === 'invalid_passcode') setError('รูปแบบรหัสไม่ถูกต้อง');
        else setError('เข้าสู่ระบบไม่สำเร็จ');
        return;
      }
      setPasscode('');
      if (data.initialized) setInfo('ตั้งรหัสเจ้าหน้าที่ครั้งแรกสำเร็จ');
      setStage('authed');
    } catch {
      setError('เครือข่ายผิดพลาด');
    } finally {
      setBusy(false);
    }
  };

  // ── ขอ OTP ──
  const requestOtp = async () => {
    resetMessages();
    setBusy(true);
    try {
      const res = await fetch('/api/admin/auth/request-otp', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'cooldown')
          setError(`รออีก ${data.retryAfterSec}s ก่อนขอ OTP ใหม่`);
        else if (data.error === 'send_failed')
          setError(`ส่งอีเมลไม่สำเร็จ: ${data.detail || 'ตรวจค่า SMTP'}`);
        else setError('ขอ OTP ไม่สำเร็จ');
        return;
      }
      setMaskedEmail(data.sentTo);
      setOtpExpiresAt(Date.now() + data.expiresInSec * 1000);
      setOtp('');
      setStage('enter-otp');
      setInfo('ส่ง OTP ไปที่อีเมลของผู้ดูแลเรียบร้อย');
    } catch {
      setError('เครือข่ายผิดพลาด');
    } finally {
      setBusy(false);
    }
  };

  // ── verify OTP ──
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!/^\d{4,8}$/.test(otp)) return setError('OTP ต้องเป็นตัวเลข 6 หลัก');
    setBusy(true);
    try {
      const res = await fetch('/api/admin/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'wrong_otp')
          setError(`OTP ไม่ถูกต้อง (เหลือ ${data.remaining} ครั้ง)`);
        else if (data.error === 'otp_expired') setError('OTP หมดอายุแล้ว ขอใหม่อีกครั้ง');
        else if (data.error === 'too_many_attempts')
          setError('กรอกผิดเกินกำหนด ขอ OTP ใหม่');
        else if (data.error === 'no_otp') setError('ยังไม่ได้ขอ OTP');
        else setError('ยืนยันไม่สำเร็จ');
        return;
      }
      setResetToken(data.resetToken);
      setOtp('');
      setStage('reset');
      setInfo('ยืนยัน OTP สำเร็จ — ตั้งรหัสใหม่ได้เลย');
    } catch {
      setError('เครือข่ายผิดพลาด');
    } finally {
      setBusy(false);
    }
  };

  // ── ตั้งรหัสใหม่ ──
  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (newPasscode.length < 6) return setError('รหัสใหม่ต้องยาวอย่างน้อย 6 ตัวอักษร');
    if (newPasscode !== confirmPasscode) return setError('ยืนยันรหัสไม่ตรงกัน');
    setBusy(true);
    try {
      const res = await fetch('/api/admin/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPasscode }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'token_expired') setError('ตั๋วหมดอายุ เริ่มใหม่อีกครั้ง');
        else if (data.error === 'invalid_passcode')
          setError(data.detail || 'รหัสใหม่ไม่ถูกต้อง');
        else setError('ตั้งรหัสใหม่ไม่สำเร็จ');
        return;
      }
      setNewPasscode('');
      setConfirmPasscode('');
      setResetToken('');
      setStage('authed');
      setInfo('เปลี่ยนรหัสเรียบร้อย เข้าสู่ระบบให้อัตโนมัติแล้ว');
    } catch {
      setError('เครือข่ายผิดพลาด');
    } finally {
      setBusy(false);
    }
  };

  // ── secs left for OTP ──
  const otpSecondsLeft = otpExpiresAt
    ? Math.max(0, Math.ceil((otpExpiresAt - now) / 1000))
    : 0;

  if (stage === 'authed' || isViewMode) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-[#001320] text-gray-300 font-mono px-4">
      {/* bg accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white/5 border border-cyan-500/30 backdrop-blur-xl rounded-sm shadow-[0_0_60px_rgba(34,211,238,0.15)] p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-cyan-500/20">
          <div>
            <p className="text-[10px] tracking-[0.4em] text-cyan-500 uppercase flex items-center gap-2">
              <Hexagon size={12} className="animate-pulse" /> Cosmic Voyager
            </p>
            <h1 className="text-xl font-serif text-white mt-1">
              {stage === 'login' && 'Admin Authorization'}
              {stage === 'request-otp' && 'Reset Passcode'}
              {stage === 'enter-otp' && 'Verify OTP'}
              {stage === 'reset' && 'Set New Passcode'}
              {stage === 'loading' && 'Verifying Session...'}
            </h1>
          </div>
          <ShieldCheck className="text-cyan-400" size={28} />
        </div>

        {stage === 'loading' && (
          <div className="flex items-center gap-3 text-sm text-cyan-400">
            <Loader2 className="animate-spin" size={16} /> ตรวจสอบสิทธิ์...
          </div>
        )}

        {stage === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            {!hasPasscode && (
              <p className="text-[11px] text-amber-400/90 bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded-sm">
                ยังไม่มีรหัสในระบบ — รหัสที่กรอกครั้งแรกจะถูกบันทึกเป็นรหัสเจ้าหน้าที่
              </p>
            )}
            <div>
              <label className="text-[11px] tracking-[0.3em] uppercase text-cyan-500 flex items-center gap-2 mb-2">
                <KeyRound size={12} /> Officer Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                disabled={busy}
                placeholder="• • • • • •"
                className="w-full bg-white/5 border border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/40 outline-none px-4 py-3 text-lg tracking-[0.5em] text-cyan-100 rounded-sm placeholder:text-cyan-800"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              onMouseDown={playSettingClick}
              className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/50 text-cyan-100 py-3 rounded-sm tracking-[0.3em] uppercase text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              Authorize
            </button>

            <button
              type="button"
              onMouseDown={playSettingClick}
              onClick={() => {
                resetMessages();
                setStage('request-otp');
              }}
              className="w-full text-[11px] text-gray-500 hover:text-cyan-300 tracking-widest uppercase pt-2"
            >
              ลืมรหัส / เปลี่ยนรหัส →
            </button>

            <div className="relative flex items-center pt-1">
              <div className="flex-1 h-px bg-white/5" />
              <span className="mx-3 text-[10px] text-gray-600 tracking-widest">OR</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <button
              type="button"
              onMouseDown={playSettingClick}
              onClick={() => { setAdminAuthed(true); setViewMode(true); }}
              className="w-full flex items-center justify-center gap-2 bg-purple-500/5 hover:bg-purple-500/15 border border-purple-500/20 hover:border-purple-400/50 text-purple-300 hover:text-purple-200 py-3 rounded-sm tracking-[0.25em] uppercase text-xs transition-all"
            >
              <Eye size={14} /> BROWSE AS VISITOR
            </button>
          </form>
        )}

        {stage === 'request-otp' && (
          <div className="space-y-5">
            <p className="text-sm text-gray-400 leading-relaxed">
              ระบบจะส่ง OTP 6 หลัก (อายุ 5 นาที) ไปยังอีเมลผู้ดูแล
              <br />
              <span className="text-cyan-300 inline-flex items-center gap-1 mt-1">
                <Mail size={12} /> sonesambidev@gmail.com
              </span>
            </p>
            <button
              onClick={requestOtp}
              disabled={busy}
              onMouseDown={playSettingClick}
              className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/50 text-cyan-100 py-3 rounded-sm tracking-[0.3em] uppercase text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              ส่ง OTP
            </button>
            <button
              type="button"
              onMouseDown={playSettingClick}
              onClick={() => {
                resetMessages();
                setStage('login');
              }}
              className="w-full text-[11px] text-gray-500 hover:text-cyan-300 tracking-widest uppercase flex items-center justify-center gap-1 pt-2"
            >
              <ArrowLeft size={12} /> กลับไปหน้า login
            </button>
          </div>
        )}

        {stage === 'enter-otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <p className="text-sm text-gray-400">
              ส่ง OTP ไปที่ <span className="text-cyan-300">{maskedEmail || 'อีเมลผู้ดูแล'}</span>
            </p>
            <div>
              <label className="text-[11px] tracking-[0.3em] uppercase text-cyan-500 mb-2 block">
                One-Time Password
              </label>
              <input
                inputMode="numeric"
                pattern="\d*"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
                disabled={busy}
                placeholder="000000"
                className="w-full bg-white/5 border border-cyan-500/30 focus:border-cyan-400 outline-none px-4 py-3 text-2xl tracking-[0.6em] text-center text-cyan-100 rounded-sm placeholder:text-cyan-800"
              />
              <div className="flex justify-between text-[10px] tracking-widest mt-2">
                <span className={otpSecondsLeft === 0 ? 'text-red-400' : 'text-gray-500'}>
                  {otpSecondsLeft > 0
                    ? `หมดอายุใน ${Math.floor(otpSecondsLeft / 60)}:${String(
                        otpSecondsLeft % 60
                      ).padStart(2, '0')}`
                    : 'OTP หมดอายุแล้ว'}
                </span>
                <button
                  type="button"
                  onMouseDown={playSettingClick}
                  onClick={requestOtp}
                  disabled={busy}
                  className="text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                >
                  ส่งใหม่
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              onMouseDown={playSettingClick}
              className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/50 text-cyan-100 py-3 rounded-sm tracking-[0.3em] uppercase text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              Verify
            </button>
            <button
              type="button"
              onMouseDown={playSettingClick}
              onClick={() => {
                resetMessages();
                setStage('login');
              }}
              className="w-full text-[11px] text-gray-500 hover:text-cyan-300 tracking-widest uppercase flex items-center justify-center gap-1 pt-2"
            >
              <ArrowLeft size={12} /> ยกเลิก
            </button>
          </form>
        )}

        {stage === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-[11px] tracking-[0.3em] uppercase text-cyan-500 flex items-center gap-2 mb-2">
                <Lock size={12} /> รหัสใหม่
              </label>
              <input
                type="password"
                value={newPasscode}
                onChange={(e) => setNewPasscode(e.target.value)}
                autoFocus
                disabled={busy}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="w-full bg-white/5 border border-cyan-500/30 focus:border-cyan-400 outline-none px-4 py-3 tracking-[0.4em] text-cyan-100 rounded-sm placeholder:text-cyan-800/60"
              />
            </div>
            <div>
              <label className="text-[11px] tracking-[0.3em] uppercase text-cyan-500 mb-2 block">
                ยืนยันรหัสใหม่
              </label>
              <input
                type="password"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
                disabled={busy}
                className="w-full bg-white/5 border border-cyan-500/30 focus:border-cyan-400 outline-none px-4 py-3 tracking-[0.4em] text-cyan-100 rounded-sm"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              onMouseDown={playSettingClick}
              className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/50 text-cyan-100 py-3 rounded-sm tracking-[0.3em] uppercase text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              บันทึกรหัสใหม่
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-sm">
            {error}
          </div>
        )}
        {info && !error && (
          <div className="mt-4 text-[11px] text-cyan-200 bg-cyan-500/10 border border-cyan-500/30 px-3 py-2 rounded-sm">
            {info}
          </div>
        )}
      </div>
    </div>
  );
}
