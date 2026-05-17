// src/models/Project.ts
import mongoose, { Schema, Document } from 'mongoose';

// กำหนดโครงสร้าง (Schema) ให้ตรงกับที่เราทำไว้ในหน้า Admin
const BlockSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  // Mixed หมายถึงเป็นได้ทั้ง String (ข้อความ) หรือ Array ของ String (สำหรับแกลลอรี่รูป)
  content: { type: Schema.Types.Mixed, required: true }, 
});

// ในไฟล์ src/models/Project.ts
const ProjectSchema = new Schema({
  title: { type: String, required: true },
  time: { type: String, required: true },
  coverImage: { type: String, default: '' },
  tags: [{ type: String }], // 👈 อย่าลืมเพิ่มบรรทัดนี้ เพื่อให้ฐานข้อมูลยอมรับ Tags นะครับ!
  blocks: [BlockSchema],
}, { timestamps: true });

// เช็คว่ามี Model นี้ในระบบหรือยัง ถ้ายังให้สร้างใหม่ (ป้องกัน Error ตอน Next.js รีโหลด)
export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);