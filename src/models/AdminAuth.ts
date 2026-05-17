import mongoose, { Schema } from 'mongoose';

const AdminAuthSchema = new Schema(
  {
    // singleton key — always 'main'
    key: { type: String, unique: true, default: 'main' },

    passcodeHash: { type: String, default: '' },
    passcodeSalt: { type: String, default: '' },

    // OTP สำหรับขอเปลี่ยนรหัส
    otpHash: { type: String, default: '' },
    otpExpiresAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },

    // ตั๋วชั่วคราวหลังยืนยัน OTP สำเร็จ — ใช้ตอนตั้งรหัสใหม่
    resetToken: { type: String, default: '' },
    resetTokenExpiresAt: { type: Date, default: null },

    // ใช้บังคับ logout ทุก session เมื่อรหัสถูกเปลี่ยน
    sessionVersion: { type: Number, default: 1 },

    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.AdminAuth ||
  mongoose.model('AdminAuth', AdminAuthSchema);
