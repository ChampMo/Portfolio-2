'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Save, ArrowLeft, Image as ImageIcon, Link as LinkIcon, 
  Type, AlignLeft, UploadCloud, Tag as TagIcon, X, Loader2, Trash2, Plus, Columns3
} from 'lucide-react';
import { uploadToCloudinary } from '@/lib/utils/uploadImage';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/context/ToastContext';
import { useThemeStore } from '@/lib/store/useThemeStore'; // 🌟 1. นำเข้าระบบตรวจสอบธีมกลาง

export type BlockType = 'heading' | 'paragraph' | 'link' | 'gallery';

export interface GalleryContent {
  title: string;
  images: string[];
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string | GalleryContent | any; 
}

export interface ProjectItem {
  _id?: string;
  id?: string;
  title: string;
  time: string;
  coverImage: string;
  tags: string[]; 
  blocks: ContentBlock[];
}

export interface TagItem {
  _id: string;
  name: string;
}

export default function SingleProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = (params.ProjectID || params.id) as string; 

  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [originalProject, setOriginalProject] = useState<ProjectItem | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  
  const { setUnsavedPath } = useAdmin();
  const { showToast } = useToast();
  const theme = useThemeStore((s) => s.theme); // 🌟 2. ดึงสถานะ Light/Dark
  const isLight = theme === 'light';

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectAndTags = async () => {
      try {
        const tagsRes = await fetch('/api/tags');
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setAvailableTags(tagsData);
        }

        if (projectId === 'new') {
          const newProj: ProjectItem = {
            id: Date.now().toString(),
            title: 'New Untitled Project',
            time: 'PRESENT',
            coverImage: '',
            tags: [],
            blocks: [],
          };
          setEditingProject(newProj);
          setOriginalProject(newProj);
        } else {
          const res = await fetch(`/api/projects/${projectId}`);
          if (res.ok) {
            const data = await res.json();
            setEditingProject(data);
            setOriginalProject(data);
          } else {
            showToast('Project not found', 'error');
            router.push('/admin/projects'); 
          }
        }
      } catch (error) {
        showToast('Connection failed.', 'error');
        router.push('/admin/projects');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjectAndTags();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, router]);

  useEffect(() => {
    if (!editingProject || !originalProject) return;
    const isChanged = JSON.stringify(editingProject) !== JSON.stringify(originalProject);
    setHasChanges(isChanged);
    setUnsavedPath('/admin/projects', isChanged);
  }, [editingProject, originalProject, setUnsavedPath]);

  const handleSaveProject = async () => {
    if (!editingProject || !hasChanges) return;
    setIsSavingProject(true);
    try {
      const payload = {
        _id: editingProject._id,
        title: editingProject.title,
        time: editingProject.time,
        coverImage: editingProject.coverImage,
        tags: editingProject.tags, 
        blocks: editingProject.blocks,
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save project');
      
      setUnsavedPath('/admin/projects', false);
      showToast('Project successfully synchronized! 🚀', 'success');
      router.push('/admin/projects'); 
    } catch (error) {
      showToast('Failed to save project.', 'error');
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleBackToList = () => {
    if (hasChanges) {
      if(!confirm('You have unsaved changes. Are you sure you want to leave?')) return;
    }
    setUnsavedPath('/admin/projects', false); 
    router.push('/admin/projects');
  };

  const handleCreateNewTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    
    setIsCreatingTag(true);
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      
      if (res.ok) {
        const createdTag = await res.json();
        setAvailableTags(prev => {
          if (!prev.find(t => t._id === createdTag._id)) {
            return [createdTag, ...prev];
          }
          return prev;
        });
        
        setEditingProject(prev => prev ? ({ 
          ...prev, 
          tags: [...(prev.tags || []), createdTag._id] 
        }) : prev);

        setIsTagModalOpen(false);
        setNewTagName('');
        showToast('Tag created successfully.', 'success');
      }
    } catch (error) {
      showToast('Failed to create tag', 'error');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleToggleTag = (tagId: string) => {
    if (!editingProject) return;
    const isSelected = editingProject.tags?.includes(tagId);
    setEditingProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tags: isSelected 
          ? prev.tags.filter(t => t !== tagId) 
          : [...(prev.tags || []), tagId]
      };
    });
  };

  // 🌟 1. ฟังก์ชันอัปโหลดรูปหน้าปก (Cover Image) ที่แก้ไขแล้ว
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingProject) return;
    setUploadingField('cover');
    try {
      const url = await uploadToCloudinary(e.target.files[0]);
      setEditingProject(prev => prev ? ({ ...prev, coverImage: url }) : prev);
    } catch (error) {
      console.error('[COVER UPLOAD ERROR]', error);
    } finally {
      setUploadingField(null);
    }
  };

  // 🌟 2. ฟังก์ชันอัปโหลดรูปกลุ่มแกลเลอรี (Gallery Blocks) ที่แก้ไขแล้ว
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockId: string) => {
    if (!e.target.files || e.target.files.length === 0 || !editingProject) return;
    setUploadingField(blockId);
    try {
      const filesArray = Array.from(e.target.files);
      const uploadedUrls = await Promise.all(filesArray.map(f => uploadToCloudinary(f)));
      
      setEditingProject(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          blocks: prev.blocks.map(b => {
            if (b.id === blockId) {
              const currentContent = typeof b.content === 'object' && !Array.isArray(b.content) 
                ? b.content as GalleryContent 
                : { title: '', images: Array.isArray(b.content) ? b.content : [] };
              
              return { 
                ...b, 
                content: { ...currentContent, images: [...currentContent.images, ...uploadedUrls] } 
              };
            }
            return b;
          })
        };
      });
    } catch (error) {
      console.error('[GALLERY UPLOAD ERROR]', error);
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemoveGalleryImage = (blockId: string, indexToRemove: number) => {
    setEditingProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map(b => {
          if (b.id === blockId) {
            const currentContent = typeof b.content === 'object' && !Array.isArray(b.content) 
                ? b.content as GalleryContent 
                : { title: '', images: Array.isArray(b.content) ? b.content : [] };
            
            return { 
              ...b, 
              content: { ...currentContent, images: currentContent.images.filter((_, idx) => idx !== indexToRemove) } 
            };
          }
          return b;
        })
      };
    });
  };

  const handleUpdateGalleryTitle = (blockId: string, newTitle: string) => {
    setEditingProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map(b => {
          if (b.id === blockId) {
            const currentContent = typeof b.content === 'object' && !Array.isArray(b.content) 
                ? b.content as GalleryContent 
                : { title: '', images: Array.isArray(b.content) ? b.content : [] };
            
            return { ...b, content: { ...currentContent, title: newTitle } };
          }
          return b;
        })
      };
    });
  };

  const addBlock = (type: BlockType) => {
    const initialContent = type === 'gallery' ? { title: '', images: [] } : '';
    const newBlock: ContentBlock = { id: Date.now().toString(), type, content: initialContent };
    setEditingProject(prev => prev ? ({ ...prev, blocks: [...prev.blocks, newBlock] }) : prev);
  };

  const updateBlockContent = (blockId: string, newContent: string) => {
    setEditingProject(prev => prev ? ({ ...prev, blocks: prev.blocks.map(b => b.id === blockId ? { ...b, content: newContent } : b) }) : prev);
  };

  const removeBlock = (blockId: string) => {
    setEditingProject(prev => prev ? ({ ...prev, blocks: prev.blocks.filter(b => b.id !== blockId) }) : prev);
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-fuchsia-400 dark:text-fuchsia-500 font-mono tracking-widest animate-pulse">MOUNTING EDITOR SYSTEM...</div>;
  }

  if (!editingProject) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32 animate-in fade-in duration-300 relative">
      
      {/* 🌟 Popup Modal สำหรับสร้าง Tag - ล็อกกระจกหนากันบั๊กทะลุจอ */}
      {isTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-white/10 dark:bg-gray-900 border border-sky-300/30 dark:border-fuchsia-500/50 p-6 rounded-sm w-full max-w-sm space-y-4 shadow-2xl backdrop-blur-2xl">
            <h3 className="text-lg font-serif text-white flex items-center gap-2 border-b border-sky-300/10 dark:border-white/10 pb-3">
              <TagIcon size={18} className="text-fuchsia-400" /> Initialize New Tag
            </h3>
            <div className="space-y-2">
              <label className="text-xs text-sky-300/60 dark:text-gray-400 uppercase font-mono">Tag Name</label>
              <input 
                type="text" 
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNewTag()}
                placeholder="e.g. Next.js, API, Docker"
                className="w-full bg-[#001320]/60 dark:bg-black/60 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-white focus:border-fuchsia-500 outline-none transition-all font-mono" 
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsTagModalOpen(false)} className="px-4 py-2 text-xs font-mono text-sky-300/50 hover:text-white transition-colors">CANCEL</button>
              <button 
                onClick={handleCreateNewTag} 
                disabled={isCreatingTag || !newTagName.trim()}
                className="px-6 py-2 bg-fuchsia-500 hover:bg-fuchsia-400 text-[#001320] font-bold text-xs font-mono tracking-widest rounded-sm transition-all disabled:opacity-50"
              >
                {isCreatingTag ? 'CREATING...' : 'CREATE & ADD'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STICKY HEADER CONTROLS */}
      <div className="sticky top-0 z-10 backdrop-blur-md pt-4 pb-4 border-b flex items-center justify-between bg-[#001320]/90 border-sky-400/30 dark:bg-gray-950/90 dark:border-fuchsia-500/30">
        <button onClick={handleBackToList} className="flex items-center gap-2 text-sky-200/50 hover:text-fuchsia-400 transition-colors text-xs font-mono tracking-widest">
          <ArrowLeft size={16} /> BACK TO ORBIT
        </button>
        <button 
          onClick={handleSaveProject}
          disabled={isSavingProject || !hasChanges}
          className={`flex items-center gap-2 px-6 py-2 font-bold text-xs tracking-widest rounded-sm transition-all border ${
            hasChanges 
              ? 'bg-fuchsia-500 border-fuchsia-400 text-[#001320] shadow-[0_0_15px_rgba(217,70,239,0.3)] cursor-pointer' 
              : 'bg-white/5 border-sky-300/20 text-sky-200/40 dark:border-white/10 cursor-not-allowed'
          }`}
        >
          {isSavingProject ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSavingProject ? 'SAVING...' : hasChanges ? 'COMMIT CONSTELLATION' : 'UP TO DATE'}
        </button>
      </div>

      {/* CORE INFO FIELD */}
      <section className="border p-6 rounded-sm space-y-6 backdrop-blur-md bg-white/5 border-sky-300/20 dark:bg-black/40 dark:border-white/10">
        <div className="space-y-2">
          <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase tracking-widest flex justify-between">
            COVER IMAGE
            {editingProject.coverImage && <span className="text-fuchsia-400">✓ Uploaded</span>}
          </label>
          <label className="border-2 border-dashed border-sky-300/20 dark:border-fuchsia-500/30 bg-sky-950/10 dark:bg-fuchsia-950/10 hover:bg-sky-950/30 dark:hover:bg-fuchsia-950/30 hover:border-fuchsia-400 transition-all p-6 rounded-sm flex flex-col items-center justify-center cursor-pointer h-40 relative group overflow-hidden">
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            {uploadingField === 'cover' ? (
               <Loader2 size={24} className="text-fuchsia-500 animate-spin" />
            ) : editingProject.coverImage ? (
               <>
                 <img src={editingProject.coverImage} alt="cover" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-all" />
                 <UploadCloud size={24} className="text-white relative z-10 opacity-0 group-hover:opacity-100 transition-all" />
               </>
            ) : (
               <>
                 <UploadCloud size={24} className="text-fuchsia-400 mb-2" />
                 <span className="text-[10px] text-sky-300/50">Click to Upload Cover</span>
               </>
            )}
          </label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Project Title</label>
            <input type="text" value={editingProject.title} onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })} className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-4 rounded-sm text-lg font-serif text-white focus:border-fuchsia-500 outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Timeline Frame</label>
            <input type="text" value={editingProject.time} onChange={(e) => setEditingProject({ ...editingProject, time: e.target.value })} placeholder="e.g. 2025" className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-4 rounded-sm text-sm text-fuchsia-300 focus:border-fuchsia-500 outline-none transition-all font-mono" />
          </div>
        </div>

        {/* PROJECT TAGS REGISTRY */}
        <div className="border-t border-sky-300/20 dark:border-white/5 pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase flex items-center gap-2">
              <TagIcon size={14} className="text-fuchsia-500" /> Project Tags
            </label>
            <button 
              onClick={() => setIsTagModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500 hover:text-black transition-all rounded-sm text-xs font-mono"
            >
              <Plus size={14} /> NEW TAG
            </button>
          </div>
          
          <div className="p-4 rounded-sm min-h-[100px] flex flex-wrap gap-2 items-start content-start border bg-white/5 border-sky-300/20 dark:bg-black/30 dark:border-white/5">
            {availableTags.length === 0 ? (
              <span className="text-xs text-sky-200/40 font-mono italic">No tags in database. Create one!</span>
            ) : (
              availableTags.map(tag => {
                const isSelected = editingProject.tags?.includes(tag._id);
                return (
                  <button 
                    key={tag._id}
                    onClick={() => handleToggleTag(tag._id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-full border transition-all ${
                      isSelected 
                        ? 'bg-fuchsia-500 border-fuchsia-500 text-[#001320] font-bold shadow-[0_0_10px_rgba(217,70,239,0.5)]' 
                        : 'bg-transparent border-sky-300/20 text-sky-200/60 hover:border-fuchsia-400 hover:text-fuchsia-300 dark:border-white/10 dark:text-gray-400'
                    }`}
                  >
                    {isSelected && <X size={12} />} {tag.name}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* DYNAMIC CONTENT BLOCKS LIST */}
      <div className="space-y-4 pt-4">
        <h3 className="font-mono text-xs text-sky-300/60 dark:text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
          <Columns3 size={14} className="text-fuchsia-500" /> DYNAMIC CONTENT BLOCKS
        </h3>
        
        {editingProject.blocks.length === 0 && (
          <div className="text-center py-10 border border-dashed rounded-sm text-sky-200/30 border-sky-300/20 dark:border-white/10 dark:text-gray-500 text-sm font-mono">
            NO CONTENT BLOCKS. SELECT A TOOL BELOW TO BEGIN.
          </div>
        )}

        {editingProject.blocks.map((block) => (
          <div key={block.id} className="relative group p-4 rounded-sm transition-colors pr-12 border bg-white/5 border-sky-300/10 hover:border-fuchsia-400/50 dark:border-white/5">
            <button onClick={() => removeBlock(block.id)} className="absolute right-3 top-4 p-1.5 text-sky-300/30 hover:bg-red-500/20 hover:text-red-400 rounded-sm transition-all"><Trash2 size={16} /></button>

            {block.type === 'heading' && (
              <div className="space-y-2">
                <label className="text-[10px] text-fuchsia-400 font-mono tracking-widest uppercase">Heading (หัวข้อย่อย)</label>
                <input type="text" value={block.content as string} onChange={(e) => updateBlockContent(block.id, e.target.value)} placeholder="Enter heading..." className="w-full bg-transparent border-b pb-2 text-xl font-serif text-white border-sky-300/10 focus:border-fuchsia-500 outline-none transition-all" />
              </div>
            )}

            {block.type === 'paragraph' && (
              <div className="space-y-2">
                <label className="text-[10px] text-fuchsia-400 font-mono tracking-widest uppercase">Paragraph (คำอธิบาย)</label>
                <textarea rows={4} value={block.content as string} onChange={(e) => updateBlockContent(block.id, e.target.value)} placeholder="Write your project details here..." className="w-full bg-white/5 border p-3 rounded-sm text-sm text-sky-100 focus:border-fuchsia-500 outline-none transition-all resize-none border-sky-300/10 dark:bg-black/40 dark:text-gray-300" />
              </div>
            )}

            {block.type === 'link' && (
              <div className="space-y-2">
                <label className="text-[10px] text-fuchsia-400 font-mono tracking-widest uppercase">External Link (ลิงก์)</label>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3 top-3.5 text-sky-400/50" />
                  <input type="url" value={block.content as string} onChange={(e) => updateBlockContent(block.id, e.target.value)} placeholder="https://..." className="w-full bg-white/5 border pl-9 pr-3 py-3 rounded-sm text-sm text-blue-400 focus:border-fuchsia-500 outline-none transition-all font-mono border-sky-300/10 dark:bg-black/40" />
                </div>
              </div>
            )}

            {block.type === 'gallery' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-fuchsia-400 font-mono tracking-widest uppercase">Gallery Title (ชื่อกลุ่มรูปภาพ)</label>
                  <input 
                    type="text" 
                    value={(block.content as GalleryContent)?.title || ''} 
                    onChange={(e) => handleUpdateGalleryTitle(block.id, e.target.value)} 
                    placeholder="e.g. System Architecture Screenshots (Optional)" 
                    className="w-full bg-fuchsia-950/10 border border-fuchsia-500/20 p-3 rounded-sm text-sm font-bold text-white focus:border-fuchsia-500 outline-none transition-all" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] text-fuchsia-400 font-mono tracking-widest uppercase">Images</label>
                  <div className="flex flex-wrap gap-4 p-4 border rounded-sm bg-white/5 border-sky-300/10 dark:bg-black/30 dark:border-white/5">
                    {((block.content as GalleryContent)?.images || (Array.isArray(block.content) ? block.content : [])).map((img: string, idx: number) => (
                      <div key={idx} className="w-24 h-24 bg-white/5 border rounded-sm relative group border-sky-300/10 dark:bg-black/60 dark:border-white/10">
                        <img src={img} alt="gallery" className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
                        <button onClick={() => handleRemoveGalleryImage(block.id, idx)} className="absolute inset-0 m-auto w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    <label className="w-24 h-24 border border-dashed border-fuchsia-500/50 hover:bg-fuchsia-500/10 rounded-sm flex flex-col items-center justify-center text-fuchsia-400 transition-all cursor-pointer">
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleGalleryUpload(e, block.id)} />
                      {uploadingField === block.id ? <Loader2 size={20} className="animate-spin" /> : <><Plus size={20} /><span className="text-[8px] font-mono mt-1">ADD IMAGE</span></>}
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* BOTTOM TOOLBAR */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-[#001320]/90 backdrop-blur-xl border p-2 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-2 border-fuchsia-500/40 dark:bg-black/80">
          <button type="button" onClick={() => addBlock('heading')} className="px-4 py-2 hover:bg-fuchsia-500/20 rounded-full flex items-center gap-2 text-xs font-mono text-sky-200 hover:text-white transition-all"><Type size={16} className="text-fuchsia-500" /> <span className="hidden sm:inline">หัวข้อ</span></button>
          <div className="w-px h-6 bg-sky-300/10 dark:bg-white/10" />
          <button type="button" onClick={() => addBlock('paragraph')} className="px-4 py-2 hover:bg-fuchsia-500/20 rounded-full flex items-center gap-2 text-xs font-mono text-sky-200 hover:text-white transition-all"><AlignLeft size={16} className="text-fuchsia-500" /> <span className="hidden sm:inline">คำอธิบาย</span></button>
          <div className="w-px h-6 bg-sky-300/10 dark:bg-white/10" />
          <button type="button" onClick={() => addBlock('link')} className="px-4 py-2 hover:bg-fuchsia-500/20 rounded-full flex items-center gap-2 text-xs font-mono text-sky-200 hover:text-white transition-all"><LinkIcon size={16} className="text-fuchsia-500" /> <span className="hidden sm:inline">ลิงก์</span></button>
          <div className="w-px h-6 bg-sky-300/10 dark:bg-white/10" />
          <button type="button" onClick={() => addBlock('gallery')} className="px-4 py-2 hover:bg-fuchsia-500/20 rounded-full flex items-center gap-2 text-xs font-mono text-sky-200 hover:text-white transition-all"><ImageIcon size={16} className="text-fuchsia-500" /> <span className="hidden sm:inline">กล่องรูปภาพ</span></button>
        </div>
      </div>
      
    </div>
  );
}