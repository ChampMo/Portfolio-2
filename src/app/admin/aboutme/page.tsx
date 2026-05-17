'use client';

import { useState, useEffect } from 'react';
import { Save, UploadCloud, Image as ImageIcon, Link as LinkIcon, GraduationCap, User, Terminal, Loader2, FileText, X, CheckCircle2, AlertCircle, Trash2, Plus } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/utils/uploadImage'; 
import { useAdmin } from '@/context/AdminContext';

export default function AboutMeAdmin() {
  const defaultData = {
    sectorData: { title: '[ IDENTITY ]', description: 'Personal identification protocols and core biography synchronization files.' },
    personalInfo: { firstName: '', lastName: '', nickname: '', motto: '', description: '', phone: '', email: '', address: '' },
    media: { coreImage: '', slideshowImages: [] as string[], cvUrl: '' },
    socialLinks: { github: '', linkedin: '', instagram: '', facebook: '' },
    education: { universityName: '', universityLogo: '', major: '', timelineStart: '', timelineEnd: '', gpax: '' },
  };

  const [formData, setFormData] = useState(defaultData);
  const [originalData, setOriginalData] = useState(defaultData);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const { setUnsavedPath, isViewMode } = useAdmin();

  useEffect(() => {
    const fetchIdentityData = async () => {
      try {
        const res = await fetch('/api/aboutme');
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            const mergedData = {
              sectorData: { ...defaultData.sectorData, ...(data.sectorData || {}) },
              personalInfo: { ...defaultData.personalInfo, ...(data.personalInfo || {}) },
              media: { ...defaultData.media, ...(data.media || {}) },
              socialLinks: { ...defaultData.socialLinks, ...(data.socialLinks || {}) },
              education: { ...defaultData.education, ...(data.education || {}) },
            };
            setFormData(mergedData);
            setOriginalData(mergedData);
          }
        }
      } catch (error) {
        console.error('Failed to load identity data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchIdentityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const isChanged = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(isChanged);
    setUnsavedPath('/admin/aboutme', isChanged);
  }, [formData, originalData, setUnsavedPath]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000); 
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hasChanges) return; 

    setIsSaving(true);
    try {
      const res = await fetch('/api/aboutme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save to database');
      
      setOriginalData(formData); 
      showToast('Identity protocols synchronized perfectly! 🪐', 'success');
    } catch (error) {
      showToast('System overload, failed to save data.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (category: keyof typeof formData, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: keyof typeof formData, field: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingField(field);
    try {
      const url = await uploadToCloudinary(e.target.files[0]);
      handleChange(category, field, url);
      showToast('Asset successfully uploaded to cloud.', 'success');
    } catch (error) {
      showToast('Upload failed. Check Cloudinary config.', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingField('slideshowImages');
    try {
      const filesArray = Array.from(e.target.files);
      const uploadedUrls = await Promise.all(filesArray.map(f => uploadToCloudinary(f)));
      
      setFormData(prev => ({
        ...prev,
        media: {
          ...prev.media,
          slideshowImages: [...prev.media.slideshowImages, ...uploadedUrls]
        }
      }));
      showToast(`${filesArray.length} images added to orbit.`, 'success');
    } catch (error) {
      showToast('Failed to upload some images.', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemoveSlideshowImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      media: {
        ...prev.media,
        slideshowImages: prev.media.slideshowImages.filter((_, idx) => idx !== indexToRemove)
      }
    }));
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-sky-400 dark:text-purple-500 font-mono tracking-widest animate-pulse">LOADING IDENTITY PROTOCOLS...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 relative">
      
      {/* 🌟 Custom Toast Notification */}
      <div className={`fixed bottom-8 right-8 z-50 transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-5 py-4 rounded-sm shadow-2xl border font-mono text-xs tracking-wide ${
          toast.type === 'success' 
            ? 'bg-sky-950/90 border-sky-500/50 text-sky-200 dark:bg-purple-950/90 dark:border-purple-500/50 dark:text-purple-200' 
            : 'bg-red-950/90 border-red-500/50 text-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="text-sky-400 dark:text-purple-400" /> : <AlertCircle size={18} className="text-red-400" />}
          {toast.message}
        </div>
      </div>

      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sky-400/30 dark:border-purple-500/30 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-sky-100 dark:text-white">Identity Configuration</h1>
          <p className="text-xs text-sky-400 dark:text-purple-500 tracking-widest mt-2">[ MANAGE ABOUT ME DATA ]</p>
        </div>
        {!isViewMode && (
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-2 px-6 py-2.5 font-bold text-xs tracking-widest rounded-sm transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)] dark:shadow-[0_0_15px_rgba(168,85,247,0.2)] ${
              hasChanges
                ? 'bg-sky-500 hover:bg-sky-400 text-[#001320] dark:bg-purple-500 dark:hover:bg-purple-400 dark:text-black cursor-pointer'
                : 'bg-white/5 text-sky-200/40 border border-sky-300/20 dark:text-gray-500 dark:border-white/10 cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'SYNCING...' : hasChanges ? 'SAVE CHANGES' : 'UP TO DATE'}
          </button>
        )}
      </div>

      <form className="space-y-8" onSubmit={handleSave}>
        
        {/* ================= SECTION 0: GLOBAL SECTOR CONFIG ================= */}
        <section className="p-6 rounded-sm space-y-4 backdrop-blur-md
          bg-white/5 border border-sky-300/20
          dark:bg-indigo-950/20 dark:border-white/10"
        >
          <h2 className="text-lg font-serif flex items-center gap-2 pb-3
            text-sky-300 dark:text-white
            border-b border-sky-300/20 dark:border-white/10"
          >
            <Terminal size={18} className="text-sky-400 dark:text-purple-400" /> Sector Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Sector Title</label>
              <input 
                type="text" 
                value={formData.sectorData.title}
                onChange={(e) => handleChange('sectorData', 'title', e.target.value)}
                className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all font-mono" 
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Sector Description</label>
              <input 
                type="text" 
                value={formData.sectorData.description}
                onChange={(e) => handleChange('sectorData', 'description', e.target.value)}
                className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" 
              />
            </div>
          </div>
        </section>
        
        {/* ================= SECTION 1: MEDIA & FILES ================= */}
        <section className="bg-white/5 dark:bg-black/40 border border-sky-300/20 dark:border-white/10 p-6 rounded-sm space-y-8 backdrop-blur-md">
          <h2 className="text-lg font-serif text-sky-300 dark:text-white flex items-center gap-2 border-b border-sky-300/20 dark:border-white/10 pb-3">
            <ImageIcon size={18} className="text-sky-400 dark:text-purple-400" /> Media & Documents
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Core Image Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs tracking-widest text-sky-200/60 dark:text-gray-400">CORE PROFILE IMAGE</label>
                {formData.media.coreImage && <span className="text-[10px] text-sky-300 dark:text-purple-400 font-mono bg-sky-500/20 dark:bg-purple-500/10 px-2 py-0.5 rounded-sm">✓ ACTIVE</span>}
              </div>
              <label className="group relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-sky-400/30 dark:border-purple-500/30 bg-sky-900/10 dark:bg-purple-950/10 hover:bg-sky-900/30 dark:hover:bg-purple-950/30 hover:border-sky-400 dark:hover:border-purple-400 transition-all rounded-sm cursor-pointer overflow-hidden">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSingleUpload(e, 'media', 'coreImage')} />
                {uploadingField === 'coreImage' ? (
                  <div className="flex flex-col items-center gap-2 text-sky-400 dark:text-purple-500">
                    <Loader2 size={28} className="animate-spin" />
                    <span className="text-xs font-mono">UPLOADING...</span>
                  </div>
                ) : formData.media.coreImage ? (
                  <>
                    <img src={formData.media.coreImage} alt="Core" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500" />
                    <div className="relative z-10 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/60 p-3 rounded-full text-white"><UploadCloud size={24} /></div>
                      <span className="text-[10px] font-bold tracking-widest text-white drop-shadow-md">CHANGE IMAGE</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-sky-200/50 dark:text-gray-400 group-hover:text-sky-400 dark:group-hover:text-purple-400 transition-colors">
                    <User size={32} className="mb-3 opacity-50" />
                    <span className="text-xs tracking-widest">UPLOAD PNG / JPG</span>
                  </div>
                )}
              </label>
            </div>

            {/* CV Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs tracking-widest text-sky-200/60 dark:text-gray-400">RESUME / CV DOCUMENT</label>
                {formData.media.cvUrl && <span className="text-[10px] text-sky-300 dark:text-purple-400 font-mono bg-sky-500/20 dark:bg-purple-500/10 px-2 py-0.5 rounded-sm">✓ UPLOADED</span>}
              </div>
              <label className="group relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-sky-400/30 dark:border-purple-500/30 bg-sky-900/10 dark:bg-purple-950/10 hover:bg-sky-900/30 dark:hover:bg-purple-950/30 hover:border-sky-400 dark:hover:border-purple-400 transition-all rounded-sm cursor-pointer overflow-hidden">
                <input type="file" accept="application/pdf, image/*" className="hidden" onChange={(e) => handleSingleUpload(e, 'media', 'cvUrl')} />
                {uploadingField === 'cvUrl' ? (
                  <div className="flex flex-col items-center gap-2 text-sky-400 dark:text-purple-500">
                    <Loader2 size={28} className="animate-spin" />
                    <span className="text-xs font-mono">UPLOADING...</span>
                  </div>
                ) : formData.media.cvUrl ? (
                  <div className="flex flex-col items-center gap-3 text-sky-400 dark:text-purple-400">
                    <FileText size={48} className="group-hover:-translate-y-2 transition-transform duration-300" />
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold">DOCUMENT ACTIVE</span>
                      <span className="text-[10px] text-sky-300/60 dark:text-purple-200/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to replace file</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-sky-200/50 dark:text-gray-400 group-hover:text-sky-400 dark:group-hover:text-purple-400 transition-colors">
                    <FileText size={32} className="mb-3 opacity-50" />
                    <span className="text-xs tracking-widest">UPLOAD PDF</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* แถวที่ 2: Slideshow Gallery */}
          <div className="space-y-4 pt-6 border-t border-sky-300/20 dark:border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs tracking-widest text-sky-200/60 dark:text-gray-400">SLIDESHOW GALLERY</label>
              <span className="text-xs font-mono text-sky-300 dark:text-purple-500 bg-sky-500/10 dark:bg-purple-500/10 px-3 py-1 rounded-sm border border-sky-400/20 dark:border-purple-500/20">
                {formData.media.slideshowImages.length} IMAGES
              </span>
            </div>
            
            {/* 🌟 [FIXED จุดที่ 1] เคลียร์ bg-black/20 ออก ใช้เป็นกระจกฝ้าหรูหราแบบโปร่งแสงเพื่อป้องกันเซฟตี้เน็ตครอบทับ */}
            <div className="p-4 rounded-sm min-h-[160px] bg-white/5 border border-sky-300/20 dark:border-white/5">
              <div className="flex flex-wrap gap-4">
                {formData.media.slideshowImages.length === 0 && uploadingField !== 'slideshowImages' && (
                  <div className="w-full flex flex-col items-center justify-center h-24 text-sky-200/40 dark:text-gray-500">
                    <ImageIcon size={28} className="opacity-30 mb-2" />
                    <span className="text-xs font-mono">NO IMAGES IN SLIDESHOW</span>
                  </div>
                )}
                {formData.media.slideshowImages.map((img, idx) => (
                  <div key={idx} className="relative group w-32 h-32 rounded-sm border overflow-hidden bg-white/5 border-sky-300/20 dark:bg-black/60 dark:border-white/10">
                    <img src={img} alt={`slide-${idx}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
                    <button
                      type="button"
                      onClick={() => handleRemoveSlideshowImage(idx)}
                      className="absolute inset-0 m-auto w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 shadow-lg"
                      title="Remove Image"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-sky-400/30 dark:border-purple-500/30 hover:border-sky-400 dark:hover:border-purple-400 hover:bg-sky-500/10 dark:hover:bg-purple-500/10 text-sky-400 dark:text-purple-500 transition-all rounded-sm cursor-pointer">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleMultiUpload} />
                  {uploadingField === 'slideshowImages' ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={24} className="mb-1" />
                      <span className="text-[10px] font-mono">ADD IMAGES</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECTION 2: PERSONAL INFO ================= */}
        <section className="bg-white/5 dark:bg-black/40 border border-sky-300/20 dark:border-white/10 p-6 rounded-sm space-y-6 backdrop-blur-md">
          <h2 className="text-lg font-serif text-sky-300 dark:text-white flex items-center gap-2 border-b border-sky-300/20 dark:border-white/10 pb-3">
            <User size={18} className="text-sky-400 dark:text-purple-400" /> Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">First Name</label>
              <input type="text" value={formData.personalInfo.firstName} onChange={(e) => handleChange('personalInfo', 'firstName', e.target.value)} placeholder="First Name" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Last Name</label>
              <input type="text" value={formData.personalInfo.lastName} onChange={(e) => handleChange('personalInfo', 'lastName', e.target.value)} placeholder="Last Name" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Nickname</label>
              <input type="text" value={formData.personalInfo.nickname} onChange={(e) => handleChange('personalInfo', 'nickname', e.target.value)} placeholder="Nickname" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Motto / Slogan</label>
            <input type="text" value={formData.personalInfo.motto} onChange={(e) => handleChange('personalInfo', 'motto', e.target.value)} placeholder="Your guiding principle..." className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-300 dark:text-purple-300 focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Description (Intro)</label>
            <textarea rows={4} value={formData.personalInfo.description} onChange={(e) => handleChange('personalInfo', 'description', e.target.value)} placeholder="Hello, I'm..." className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-sky-300/20 dark:border-white/5">
            <div className="space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Phone Number</label>
              <input type="text" value={formData.personalInfo.phone} onChange={(e) => handleChange('personalInfo', 'phone', e.target.value)} placeholder="08x-xxx-xxxx" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Email Address</label>
              <input type="email" value={formData.personalInfo.email} onChange={(e) => handleChange('personalInfo', 'email', e.target.value)} placeholder="example@email.com" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Base Location (Address)</label>
              <input type="text" value={formData.personalInfo.address} onChange={(e) => handleChange('personalInfo', 'address', e.target.value)} placeholder="Bangkok, Thailand" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
            </div>
          </div>
        </section>

        {/* ================= SECTION 3: SOCIAL LINKS ================= */}
        <section className="bg-white/5 dark:bg-black/40 border border-sky-300/20 dark:border-white/10 p-6 rounded-sm space-y-6 backdrop-blur-md">
          <h2 className="text-lg font-serif text-sky-300 dark:text-white flex items-center gap-2 border-b border-sky-300/20 dark:border-white/10 pb-3">
            <LinkIcon size={18} className="text-sky-400 dark:text-purple-400" /> Social Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">GitHub URL</label>
              <input type="url" value={formData.socialLinks.github} onChange={(e) => handleChange('socialLinks', 'github', e.target.value)} placeholder="https://github.com/..." className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">LinkedIn URL</label>
              <input type="url" value={formData.socialLinks.linkedin} onChange={(e) => handleChange('socialLinks', 'linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Instagram URL</label>
              <input type="url" value={formData.socialLinks.instagram} onChange={(e) => handleChange('socialLinks', 'instagram', e.target.value)} placeholder="https://instagram.com/..." className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Facebook URL</label>
              <input type="url" value={formData.socialLinks.facebook} onChange={(e) => handleChange('socialLinks', 'facebook', e.target.value)} placeholder="https://facebook.com/..." className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
            </div>
          </div>
        </section>

        {/* ================= SECTION 4: EDUCATION ================= */}
        <section className="bg-white/5 dark:bg-black/40 border border-sky-300/20 dark:border-white/10 p-6 rounded-sm space-y-6 backdrop-blur-md">
          <h2 className="text-lg font-serif text-sky-300 dark:text-white flex items-center gap-2 border-b border-sky-300/20 dark:border-white/10 pb-3">
            <GraduationCap size={18} className="text-sky-400 dark:text-purple-400" /> Origin (Education)
          </h2>
          
          {/* Row 1: Logo + University Name & Major */}
          <div className="flex gap-5 items-start">
            <div className="shrink-0 space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase block">Logo</label>
              <label className="w-24 h-24 bg-white/5 border-2 border-dashed border-sky-400/30 dark:border-purple-500/30 hover:border-sky-400 dark:hover:border-purple-400 hover:bg-sky-500/10 dark:hover:bg-purple-500/10 rounded-sm flex items-center justify-center cursor-pointer relative overflow-hidden group transition-all">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSingleUpload(e, 'education', 'universityLogo')} />
                {uploadingField === 'universityLogo' ? (
                  <Loader2 size={20} className="text-sky-400 dark:text-purple-500 animate-spin" />
                ) : formData.education.universityLogo ? (
                  <>
                    <img src={formData.education.universityLogo} alt="University Logo" className="absolute inset-0 w-full h-full object-contain p-2 opacity-90 group-hover:opacity-30 transition-opacity" />
                    <div className="relative z-10 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                      <UploadCloud size={16} />
                      <span className="text-[9px] font-mono">CHANGE</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-sky-200/40 dark:text-gray-500 group-hover:text-sky-400 dark:group-hover:text-purple-400 transition-colors">
                    <UploadCloud size={20} className="mb-1" />
                    <span className="text-[9px] font-mono">LOGO</span>
                  </div>
                )}
              </label>
            </div>

            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">University Name</label>
                <input type="text" value={formData.education.universityName} onChange={(e) => handleChange('education', 'universityName', e.target.value)} placeholder="KMUTT" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Major / Field of Study</label>
                <input type="text" value={formData.education.major} onChange={(e) => handleChange('education', 'major', e.target.value)} placeholder="Computer Science" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
              </div>
            </div>
          </div>

          {/* Row 2: Timeline + GPAX */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-sky-300/20 dark:border-white/5">
            <div className="space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Start Year</label>
              <input type="text" value={formData.education.timelineStart} onChange={(e) => handleChange('education', 'timelineStart', e.target.value)} placeholder="2020" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-center text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">End Year</label>
              <input type="text" value={formData.education.timelineEnd} onChange={(e) => handleChange('education', 'timelineEnd', e.target.value)} placeholder="2024" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-center text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">GPAX</label>
              <input type="text" value={formData.education.gpax} onChange={(e) => handleChange('education', 'gpax', e.target.value)} placeholder="3.XX" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-300 dark:text-purple-300 focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
            </div>
          </div>
        </section>

      </form>
    </div>
  );
}