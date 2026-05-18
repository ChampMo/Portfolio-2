import mongoose, { Schema } from 'mongoose';

const IdentitySchema = new Schema(
  {
    sectorData: {
      title: { type: String, default: '[ IDENTITY ]' },
      description: { type: String, default: '' },
    },
    personalInfo: {
      firstName: { type: String, default: '' },
      lastName: { type: String, default: '' },
      nickname: { type: String, default: '' },
      motto: { type: String, default: '' },
      description: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    media: {
      coreImage: { type: String, default: '' },
      slideshowImages: [{ type: String }],
      cvUrl: { type: String, default: '' },
      cvVisible: { type: Boolean, default: true },
      transcriptUrl: { type: String, default: '' },
      transcriptVisible: { type: Boolean, default: true },
    },
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
    },
    education: {
      universityName: { type: String, default: '' },
      universityLogo: { type: String, default: '' },
      major: { type: String, default: '' },
      timelineStart: { type: String, default: '' },
      timelineEnd: { type: String, default: '' },
      gpax: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Identity || mongoose.model('Identity', IdentitySchema);