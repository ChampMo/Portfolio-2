import mongoose, { Schema } from 'mongoose';

const SkillSchema = new Schema(
  {
    sectorData: {
      title: { type: String, default: '[ TECH FORGE ]' },
      description: { type: String, default: '' },
    },
    skills: {
      languages: [{ type: String }],
      database: [{ type: String }],
      frameworks: [{ type: String }],
      tools: [{ type: String }],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Skill || mongoose.model('Skill', SkillSchema);