'use client';

import { useState, useEffect } from 'react';
import { Save, UploadCloud, Image as ImageIcon, Link as LinkIcon, GraduationCap, User, Terminal, Loader2, FileText, CheckCircle2, AlertCircle, Trash2, Plus, Eye, EyeOff, Scroll, ExternalLink } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/utils/uploadImage';
import { useAdmin } from '@/context/AdminContext';

const defaultData = {
  sectorData: { title: '[ IDENTITY ]', description: 'Personal identification protocols and core biography synchronization files.' },
  personalInfo: { firstName: '', lastName: '', nickname: '', motto: '', description: '', phone: '', email: '', address: '' },
  media: {
    coreImage: '',
    slideshowImages: [] as string[],
    cvUrl: '',
    cvVisible: true,
    transcriptUrl: '',
    transcriptVisible: true,
  },
  socialLinks: { github: '', linkedin: '', instagram: '', facebook: '' },
  education: { universityName: '', universityLogo: '', major: '', timelineStart: '', timelineEnd: '', gpax: '' },
};

type FormData = typeof defaultData;

async function deleteFromCloudinary(url: string) {
  if (!url) return;
  try {
    await fetch('/api/cloudinary-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
  } catch {
    // non-critical — log only
    console.warn('[ CLOUDINARY DELETE FAILED ]', url);
  }
}

export default function AboutMeAdmin() {
  const [formData, setFormData] = useState<FormData>(defaultData);
  const [originalData, setOriginalData] = useState<FormData>(defaultData);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  // URLs removed from slideshow that should be deleted from Cloudinary on next successful save
  const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);
  // Document input mode: 'upload' shows file picker, 'url' shows text input
  const [docMode, setDocMode] = useState<Record<string, 'upload' | 'url'>>({ cvUrl: 'upload', transcriptUrl: 'upload' });
  const [docUrlDraft, setDocUrlDraft] = useState<Record<string, string>>({ cvUrl: '', transcriptUrl: '' });
  const { setUnsavedPath, isViewMode } = useAdmin();

  useEffect(() => {
    const fetchIdentityData = async () => {
      try {
        const res = await fetch('/api/aboutme');
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            const merged: FormData = {
              sectorData: { ...defaultData.sectorData, ...(data.sectorData || {}) },
              personalInfo: { ...defaultData.personalInfo, ...(data.personalInfo || {}) },
              media: { ...defaultData.media, ...(data.media || {}) },
              socialLinks: { ...defaultData.socialLinks, ...(data.socialLinks || {}) },
              education: { ...defaultData.education, ...(data.education || {}) },
            };
            setFormData(merged);
            setOriginalData(merged);
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

  const handleSave = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/aboutme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to save');
      setOriginalData(formData);
      // Delete removed slideshow images from Cloudinary after successful save
      await Promise.allSettled(pendingDeletes.map(deleteFromCloudinary));
      setPendingDeletes([]);
      showToast('Identity protocols synchronized perfectly! 🪐', 'success');
    } catch {
      showToast('System overload, failed to save data.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (category: keyof FormData, field: string, value: string) => {
    setFormData(prev => ({ ...prev, [category]: { ...(prev[category] as object), [field]: value } }));
  };

  const handleToggle = (field: 'cvVisible' | 'transcriptVisible') => {
    setFormData(prev => ({ ...prev, media: { ...prev.media, [field]: !prev.media[field] } }));
  };

  const handleSingleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: keyof FormData,
    field: string
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingField(field);
    try {
      // If replacing an existing file, queue old URL for Cloudinary deletion
      const oldUrl = (formData[category] as Record<string, unknown>)[field];
      if (typeof oldUrl === 'string' && oldUrl) {
        setPendingDeletes(prev => [...prev, oldUrl]);
      }
      const url = await uploadToCloudinary(e.target.files[0]);
      handleChange(category, field, url);
      showToast('Asset successfully uploaded to cloud.', 'success');
    } catch {
      showToast('Upload failed. Check Cloudinary config.', 'error');
    } finally {
      setUploadingField(null);
      e.target.value = '';
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
        media: { ...prev.media, slideshowImages: [...prev.media.slideshowImages, ...uploadedUrls] },
      }));
      showToast(`${filesArray.length} images added to orbit.`, 'success');
    } catch {
      showToast('Failed to upload some images.', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemoveSlideshowImage = (indexToRemove: number) => {
    const urlToRemove = formData.media.slideshowImages[indexToRemove];
    if (urlToRemove) setPendingDeletes(prev => [...prev, urlToRemove]);
    setFormData(prev => ({
      ...prev,
      media: { ...prev.media, slideshowImages: prev.media.slideshowImages.filter((_, idx) => idx !== indexToRemove) },
    }));
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-sky-400 dark:text-purple-500 font-mono tracking-widest animate-pulse">LOADING IDENTITY PROTOCOLS...</div>;
  }

  // ── reusable toggle component ──────────────────────────────────────
  const VisibilityToggle = ({ field, label }: { field: 'cvVisible' | 'transcriptVisible'; label: string }) => {
    const on = formData.media[field];
    return (
      <button
        type="button"
        onClick={() => handleToggle(field)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-xs font-mono tracking-wider transition-all ${
          on
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
            : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
        }`}
        title={`${on ? 'Hide' : 'Show'} ${label} button on frontend`}
      >
        {on ? <Eye size={13} /> : <EyeOff size={13} />}
        {on ? 'VISIBLE' : 'HIDDEN'}
      </button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 relative">

      {/* Toast */}
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sky-400/30 dark:border-purple-500/30 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-sky-100 dark:text-white">Identity Configuration</h1>
          <p className="text-xs text-sky-400 dark:text-purple-500 tracking-widest mt-2">[ MANAGE ABOUT ME DATA ]</p>
        </div>
        {!isViewMode && (
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-2 px-6 py-2.5 font-bold text-xs tracking-widest rounded-sm transition-all ${
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

        {/* SECTION 0: SECTOR CONFIG */}
        <section className="p-6 rounded-sm space-y-4 backdrop-blur-md bg-white/5 border border-sky-300/20 dark:bg-indigo-950/20 dark:border-white/10">
          <h2 className="text-lg font-serif flex items-center gap-2 pb-3 text-sky-300 dark:text-white border-b border-sky-300/20 dark:border-white/10">
            <Terminal size={18} className="text-sky-400 dark:text-purple-400" /> Sector Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Sector Title</label>
              <input type="text" value={formData.sectorData.title} onChange={(e) => handleChange('sectorData', 'title', e.target.value)} className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all font-mono" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Sector Description</label>
              <input type="text" value={formData.sectorData.description} onChange={(e) => handleChange('sectorData', 'description', e.target.value)} className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" />
            </div>
          </div>
        </section>

        {/* SECTION 1: MEDIA & FILES */}
        <section className="bg-white/5 dark:bg-black/40 border border-sky-300/20 dark:border-white/10 p-6 rounded-sm space-y-6 backdrop-blur-md">
          <h2 className="text-lg font-serif text-sky-300 dark:text-white flex items-center gap-2 border-b border-sky-300/20 dark:border-white/10 pb-3">
            <ImageIcon size={18} className="text-sky-400 dark:text-purple-400" /> Media & Documents
          </h2>

          {/* ── PHOTO + DOCUMENTS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">

            {/* Left: Core Profile Image (tall) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs tracking-widest text-sky-200/60 dark:text-gray-400">CORE PHOTO</span>
                {formData.media.coreImage && <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/20">✓ ACTIVE</span>}
              </div>
              <label className="group relative flex flex-col items-center justify-center w-full aspect-3/4 border-2 border-dashed border-sky-400/30 dark:border-purple-500/30 bg-sky-900/10 dark:bg-purple-950/10 hover:bg-sky-900/30 dark:hover:bg-purple-950/30 hover:border-sky-400 dark:hover:border-purple-400 transition-all rounded-sm cursor-pointer overflow-hidden">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSingleUpload(e, 'media', 'coreImage')} />
                {uploadingField === 'coreImage' ? (
                  <div className="flex flex-col items-center gap-2 text-sky-400 dark:text-purple-500">
                    <Loader2 size={28} className="animate-spin" /><span className="text-xs font-mono">UPLOADING...</span>
                  </div>
                ) : formData.media.coreImage ? (
                  <>
                    <img src={formData.media.coreImage} alt="Core" className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500" />
                    <div className="relative z-10 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/70 p-3 rounded-full text-white shadow-lg"><UploadCloud size={22} /></div>
                      <span className="text-[10px] font-bold tracking-widest text-white drop-shadow-md bg-black/50 px-2 py-0.5 rounded-sm">CHANGE PHOTO</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-sky-200/40 dark:text-gray-500 group-hover:text-sky-400 dark:group-hover:text-purple-400 transition-colors gap-3">
                    <User size={36} className="opacity-40" />
                    <span className="text-xs tracking-widest">UPLOAD PNG / JPG</span>
                  </div>
                )}
              </label>
            </div>

            {/* Right: Documents stacked */}
            <div className="flex flex-col gap-4">
              <span className="text-xs tracking-widest text-sky-200/60 dark:text-gray-400">DOCUMENTS</span>

              {(['cvUrl', 'transcriptUrl'] as const).map((field) => {
                const isCv = field === 'cvUrl';
                const url = formData.media[field];
                const visField = isCv ? 'cvVisible' : 'transcriptVisible';
                const label = isCv ? 'RESUME / CV' : 'TRANSCRIPT';
                const DocIcon = isCv ? FileText : Scroll;
                const isUploading = uploadingField === field;
                const mode = docMode[field];
                const draft = docUrlDraft[field];
                const inputId = `doc-upload-${field}`;

                return (
                  <div key={field} className={`rounded-sm border transition-all ${
                    url
                      ? 'bg-white/5 border-sky-300/20 dark:bg-white/3 dark:border-white/10'
                      : 'border-dashed border-sky-400/20 dark:border-white/8'
                  }`}>
                    {/* ── Top row: status + controls ── */}
                    <div className="flex items-center gap-4 p-4">
                      {/* Icon */}
                      <div className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-sm border ${
                        url
                          ? 'bg-sky-500/10 border-sky-400/30 text-sky-400 dark:bg-purple-500/10 dark:border-purple-500/30 dark:text-purple-400'
                          : 'bg-white/5 border-white/10 text-gray-600'
                      }`}>
                        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <DocIcon size={18} />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono tracking-widest text-sky-200/60 dark:text-gray-400">{label}</p>
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-sky-300 dark:text-purple-300 hover:underline mt-0.5 truncate max-w-full"
                          >
                            <ExternalLink size={11} className="shrink-0" />
                            <span className="truncate">Preview / Open</span>
                          </a>
                        ) : (
                          <p className="text-sm text-gray-600 mt-0.5">No document set</p>
                        )}
                      </div>

                      {/* Right actions */}
                      <div className="shrink-0 flex items-center gap-2">
                        {url && <VisibilityToggle field={visField} label={label} />}
                        {url && (
                          <button type="button"
                            onClick={() => handleChange('media', field, '')}
                            className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── Bottom row: mode tabs + input ── */}
                    <div className="border-t border-sky-300/10 dark:border-white/6 px-4 py-3 flex flex-col gap-2">
                      {/* Tab switcher */}
                      <div className="flex gap-1">
                        {(['upload', 'url'] as const).map((m) => (
                          <button key={m} type="button"
                            onClick={() => setDocMode(prev => ({ ...prev, [field]: m }))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono tracking-wider border transition-all ${
                              mode === m
                                ? 'bg-sky-500/15 border-sky-400/50 text-sky-300 dark:bg-purple-500/15 dark:border-purple-500/50 dark:text-purple-300'
                                : 'border-white/8 text-gray-600 hover:text-gray-400 hover:border-white/15'
                            }`}
                          >
                            {m === 'upload' ? <><UploadCloud size={12} /> Upload file</> : <><ExternalLink size={12} /> Paste URL</>}
                          </button>
                        ))}
                      </div>

                      {/* Upload mode */}
                      {mode === 'upload' && (
                        <label htmlFor={inputId}
                          className="flex items-center justify-center gap-2 py-2.5 border border-dashed border-sky-400/30 dark:border-purple-500/30 rounded-sm text-xs font-mono text-sky-300/70 dark:text-purple-400/70 hover:bg-sky-500/8 hover:border-sky-400 hover:text-sky-200 dark:hover:bg-purple-500/8 dark:hover:border-purple-400 dark:hover:text-purple-200 cursor-pointer transition-all"
                        >
                          {isUploading
                            ? <><Loader2 size={13} className="animate-spin" /> UPLOADING...</>
                            : <><UploadCloud size={13} /> {url ? 'REPLACE FILE' : 'SELECT PDF / IMAGE'}</>
                          }
                        </label>
                      )}
                      <input id={inputId} type="file" accept="application/pdf,image/*" className="hidden"
                        onChange={(e) => handleSingleUpload(e, 'media', field)} />

                      {/* URL mode */}
                      {mode === 'url' && (
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={draft}
                            onChange={(e) => setDocUrlDraft(prev => ({ ...prev, [field]: e.target.value }))}
                            placeholder="https://drive.google.com/file/d/..."
                            className="flex-1 bg-white/5 border border-sky-300/20 dark:border-white/10 px-3 py-2 rounded-sm text-xs text-white font-mono placeholder:text-gray-600 focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all"
                          />
                          <button type="button"
                            onClick={() => {
                              if (draft.trim()) {
                                const oldUrl = formData.media[field];
                                if (oldUrl) setPendingDeletes(prev => [...prev, oldUrl]);
                                handleChange('media', field, draft.trim());
                                setDocUrlDraft(prev => ({ ...prev, [field]: '' }));
                              }
                            }}
                            className="px-3 py-2 bg-sky-500/15 border border-sky-400/40 text-sky-300 hover:bg-sky-500/30 dark:bg-purple-500/15 dark:border-purple-500/40 dark:text-purple-300 dark:hover:bg-purple-500/30 rounded-sm text-xs font-mono tracking-wider transition-all disabled:opacity-30"
                            disabled={!draft.trim()}
                          >
                            SET
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <p className="text-[10px] font-mono text-gray-600 pl-1">
                Upload: Cloudinary · Paste URL: Google Drive, Dropbox, or any direct link · Toggle = show/hide button on frontend
              </p>
            </div>
          </div>

          {/* ── SLIDESHOW GALLERY ── */}
          <div className="space-y-3 pt-5 border-t border-sky-300/20 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-widest text-sky-200/60 dark:text-gray-400">SLIDESHOW GALLERY</span>
              <span className="text-xs font-mono text-sky-300 dark:text-purple-500 bg-sky-500/10 dark:bg-purple-500/10 px-3 py-1 rounded-sm border border-sky-400/20 dark:border-purple-500/20">
                {formData.media.slideshowImages.length} IMAGES
              </span>
            </div>
            <div className="p-4 rounded-sm min-h-40 bg-white/5 border border-sky-300/20 dark:border-white/5">
              <div className="flex flex-wrap gap-3">
                {formData.media.slideshowImages.length === 0 && uploadingField !== 'slideshowImages' && (
                  <div className="w-full flex flex-col items-center justify-center h-24 text-sky-200/30 dark:text-gray-600">
                    <ImageIcon size={28} className="opacity-30 mb-2" />
                    <span className="text-xs font-mono">NO IMAGES IN SLIDESHOW</span>
                  </div>
                )}
                {formData.media.slideshowImages.map((img, idx) => (
                  <div key={idx} className="relative group w-28 h-28 rounded-sm border overflow-hidden bg-white/5 border-sky-300/20 dark:bg-black/60 dark:border-white/10">
                    <img src={img} alt={`slide-${idx}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-30 transition-opacity duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleRemoveSlideshowImage(idx)}
                        className="w-9 h-9 flex items-center justify-center bg-red-500 hover:bg-red-400 text-white rounded-full shadow-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-6 bg-linear-to-t from-black/60 to-transparent flex items-end justify-center pb-1">
                      <span className="text-[9px] font-mono text-white/60">#{idx + 1}</span>
                    </div>
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-sky-400/25 dark:border-purple-500/25 hover:border-sky-400 dark:hover:border-purple-400 text-sky-400/60 dark:text-purple-500/60 hover:text-sky-400 dark:hover:text-purple-400 transition-all rounded-sm cursor-pointer">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleMultiUpload} />
                  {uploadingField === 'slideshowImages' ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <><Plus size={22} className="mb-1" /><span className="text-[10px] font-mono">ADD</span></>
                  )}
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: PERSONAL INFO */}
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

        {/* SECTION 3: SOCIAL LINKS */}
        <section className="bg-white/5 dark:bg-black/40 border border-sky-300/20 dark:border-white/10 p-6 rounded-sm space-y-6 backdrop-blur-md">
          <h2 className="text-lg font-serif text-sky-300 dark:text-white flex items-center gap-2 border-b border-sky-300/20 dark:border-white/10 pb-3">
            <LinkIcon size={18} className="text-sky-400 dark:text-purple-400" /> Social Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">GitHub URL</label><input type="url" value={formData.socialLinks.github} onChange={(e) => handleChange('socialLinks', 'github', e.target.value)} placeholder="https://github.com/..." className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" /></div>
            <div className="space-y-1"><label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">LinkedIn URL</label><input type="url" value={formData.socialLinks.linkedin} onChange={(e) => handleChange('socialLinks', 'linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" /></div>
            <div className="space-y-1"><label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Instagram URL</label><input type="url" value={formData.socialLinks.instagram} onChange={(e) => handleChange('socialLinks', 'instagram', e.target.value)} placeholder="https://instagram.com/..." className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" /></div>
            <div className="space-y-1"><label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Facebook URL</label><input type="url" value={formData.socialLinks.facebook} onChange={(e) => handleChange('socialLinks', 'facebook', e.target.value)} placeholder="https://facebook.com/..." className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" /></div>
          </div>
        </section>

        {/* SECTION 4: EDUCATION */}
        <section className="bg-white/5 dark:bg-black/40 border border-sky-300/20 dark:border-white/10 p-6 rounded-sm space-y-6 backdrop-blur-md">
          <h2 className="text-lg font-serif text-sky-300 dark:text-white flex items-center gap-2 border-b border-sky-300/20 dark:border-white/10 pb-3">
            <GraduationCap size={18} className="text-sky-400 dark:text-purple-400" /> Origin (Education)
          </h2>
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
                    <div className="relative z-10 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-white"><UploadCloud size={16} /><span className="text-[9px] font-mono">CHANGE</span></div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-sky-200/40 dark:text-gray-500 group-hover:text-sky-400 dark:group-hover:text-purple-400 transition-colors"><UploadCloud size={20} className="mb-1" /><span className="text-[9px] font-mono">LOGO</span></div>
                )}
              </label>
            </div>
            <div className="flex-1 space-y-3">
              <div className="space-y-1"><label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">University Name</label><input type="text" value={formData.education.universityName} onChange={(e) => handleChange('education', 'universityName', e.target.value)} placeholder="KMUTT" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" /></div>
              <div className="space-y-1"><label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Major / Field of Study</label><input type="text" value={formData.education.major} onChange={(e) => handleChange('education', 'major', e.target.value)} placeholder="Computer Science" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" /></div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-sky-300/20 dark:border-white/5">
            <div className="space-y-1"><label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Start Year</label><input type="text" value={formData.education.timelineStart} onChange={(e) => handleChange('education', 'timelineStart', e.target.value)} placeholder="2020" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-center text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" /></div>
            <div className="space-y-1"><label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">End Year</label><input type="text" value={formData.education.timelineEnd} onChange={(e) => handleChange('education', 'timelineEnd', e.target.value)} placeholder="2024" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-center text-sky-100 dark:text-white focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" /></div>
            <div className="space-y-1"><label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">GPAX</label><input type="text" value={formData.education.gpax} onChange={(e) => handleChange('education', 'gpax', e.target.value)} placeholder="3.XX" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-300 dark:text-purple-300 focus:border-sky-400 dark:focus:border-purple-500 outline-none transition-all" /></div>
          </div>
        </section>

      </form>
    </div>
  );
}
