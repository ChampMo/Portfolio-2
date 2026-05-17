import mongoose, { Schema } from 'mongoose';

const ExperienceItemSchema = new Schema({
  title: { type: String, required: true },
  time: { type: String, required: true }, // ช่องกรอกเวลาอิสระสำหรับกรองเอง
  details: [{ type: String }], // บูลเล็ตรายละเอียดงานหลายๆ ข้อ
});

const ExperienceSchema = new Schema(
  {
    sectorData: {
      title: { type: String, default: '[ CHRONO-RING ]' },
      description: { type: String, default: '' },
    },
    experiences: [ExperienceItemSchema], // สแต็คอาเรย์ไทม์ไลน์
  },
  { timestamps: true }
);

export default mongoose.models.Experience || mongoose.model('Experience', ExperienceSchema);