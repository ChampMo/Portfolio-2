import mongoose, { Schema } from 'mongoose';

const ServiceItemSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  linkedProjectIds: [{ type: String }], // อ้างอิง ID ของโปรเจกต์ใน MongoDB
});

const ServiceSchema = new Schema(
  {
    sectorData: {
      title: { type: String, default: '[ ENERGY HUB ]' },
      description: { type: String, default: '' },
    },
    services: [ServiceItemSchema], // เก็บเป็น Array ของ Services ตัวย่อย
  },
  { timestamps: true }
);

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);