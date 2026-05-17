import mongoose, { Schema } from 'mongoose';

const ProjectMetaSchema = new Schema(
  {
    sectorData: {
      title: { type: String, default: '[ CONSTELLATION ]' },
      description: { type: String, default: 'A stellar map of my complete projects, experiments, and case studies.' },
    },
  },
  { timestamps: true }
);

export default mongoose.models.ProjectMeta || mongoose.model('ProjectMeta', ProjectMetaSchema);