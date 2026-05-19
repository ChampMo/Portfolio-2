'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Save, ArrowLeft, Image as ImageIcon, Link as LinkIcon,
  Type, AlignLeft, Tag as TagIcon, X, Loader2, Trash2, Plus, Columns3, Eye, GripVertical, Settings
} from 'lucide-react';
import { uploadToCloudinary } from '@/lib/utils/uploadImage';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import DragDropImageUpload from '@/components/admin/DragDropImageUpload';

export type BlockType = 'heading' | 'paragraph' | 'link' | 'gallery';

export interface GalleryContent {
  title: string;
  images: string[];
  height?: number;
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
  const [isManageTagsOpen, setIsManageTagsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isDeletingTag, setIsDeletingTag] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Block drag-to-reorder state
  const [blockDrag, setBlockDrag] = useState<number | null>(null);
  const [blockDragOver, setBlockDragOver] = useState<number | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  // Gallery drag-to-reorder state
  const [galleryDrag, setGalleryDrag] = useState<{ blockId: string; idx: number } | null>(null);
  const [galleryDragOver, setGalleryDragOver] = useState<{ blockId: string; idx: number } | null>(null);

  const { setUnsavedPath, isViewMode } = useAdmin();
  const { showToast } = useToast();
  const openConfirm = useConfirm();

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

  const handleBackToList = async () => {
    if (hasChanges) {
      if (!await openConfirm({ title: 'Unsaved Changes', message: 'You have unsaved changes. Leave without saving?', variant: 'warning', confirmLabel: 'LEAVE' })) return;
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

      if (!res.ok) throw new Error('Create failed');
      const createdTag = await res.json();
      setAvailableTags(prev => {
        if (prev.find(t => t._id === createdTag._id)) return prev;
        return [createdTag, ...prev];
      });
      setEditingProject(prev => prev ? ({ ...prev, tags: [...(prev.tags || []), createdTag._id] }) : prev);
      setNewTagName('');
      showToast('Tag created and selected.', 'success');
    } catch {
      showToast('Failed to create tag.', 'error');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    setIsDeletingTag(tagId);
    try {
      const res = await fetch('/api/tags', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tagId }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setAvailableTags(prev => prev.filter(t => t._id !== tagId));
      // Remove from current project selection if it was selected
      setEditingProject(prev => prev ? ({ ...prev, tags: prev.tags.filter(t => t !== tagId) }) : prev);
      showToast('Tag deleted.', 'success');
    } catch {
      showToast('Failed to delete tag.', 'error');
    } finally {
      setIsDeletingTag(null);
    }
  };

  const handleToggleTag = (tagId: string) => {
    if (!editingProject) return;
    const isSelected = editingProject.tags?.includes(tagId);
    setEditingProject(prev => {
      if (!prev) return prev;
      return { ...prev, tags: isSelected ? prev.tags.filter(t => t !== tagId) : [...(prev.tags || []), tagId] };
    });
  };

  // Cover image upload (supports drag-drop via DragDropImageUpload component)
  const handleCoverFileDrop = async (file: File) => {
    setUploadingField('cover');
    try {
      const url = await uploadToCloudinary(file);
      setEditingProject(prev => prev ? ({ ...prev, coverImage: url }) : prev);
    } catch (error) {
      showToast('Cover upload failed.', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  // Gallery: upload files (from file input or filesystem drag-drop)
  const handleGalleryFileDrop = async (files: File[], blockId: string) => {
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (!validFiles.length) return;
    setUploadingField(blockId);
    try {
      const urls = await Promise.all(validFiles.map(f => uploadToCloudinary(f)));
      setEditingProject(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          blocks: prev.blocks.map(b => {
            if (b.id !== blockId) return b;
            const gc = typeof b.content === 'object' && !Array.isArray(b.content)
              ? b.content as GalleryContent
              : { title: '', images: [] };
            return { ...b, content: { ...gc, images: [...(gc.images || []), ...urls] } };
          }),
        };
      });
    } catch (error) {
      showToast('Gallery upload failed.', 'error');
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
          if (b.id !== blockId) return b;
          const gc = typeof b.content === 'object' && !Array.isArray(b.content)
            ? b.content as GalleryContent
            : { title: '', images: [] };
          return { ...b, content: { ...gc, images: gc.images.filter((_, idx) => idx !== indexToRemove) } };
        }),
      };
    });
  };

  // Gallery drag-to-reorder handlers
  const handleGalleryImgDragStart = (blockId: string, idx: number) => {
    setGalleryDrag({ blockId, idx });
  };

  const handleGalleryImgDragEnter = (blockId: string, idx: number) => {
    if (galleryDrag?.blockId === blockId) setGalleryDragOver({ blockId, idx });
  };

  const handleGalleryImgDragEnd = () => {
    if (
      galleryDrag && galleryDragOver &&
      galleryDrag.blockId === galleryDragOver.blockId &&
      galleryDrag.idx !== galleryDragOver.idx
    ) {
      const { blockId, idx: from } = galleryDrag;
      const to = galleryDragOver.idx;
      setEditingProject(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          blocks: prev.blocks.map(b => {
            if (b.id !== blockId) return b;
            const gc = b.content as GalleryContent;
            const imgs = [...gc.images];
            const [moved] = imgs.splice(from, 1);
            imgs.splice(to, 0, moved);
            return { ...b, content: { ...gc, images: imgs } };
          }),
        };
      });
    }
    setGalleryDrag(null);
    setGalleryDragOver(null);
  };

  // Gallery container drop (filesystem files only)
  const handleGalleryAreaDrop = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes('Files')) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleGalleryFileDrop(files, blockId);
  };

  const handleUpdateGalleryHeight = (blockId: string, newHeight: number) => {
    setEditingProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map(b => {
          if (b.id !== blockId) return b;
          const gc = typeof b.content === 'object' && !Array.isArray(b.content)
            ? b.content as GalleryContent
            : { title: '', images: [], height: 300 };
          return { ...b, content: { ...gc, height: newHeight } };
        }),
      };
    });
  };

  const handleUpdateGalleryTitle = (blockId: string, newTitle: string) => {
    setEditingProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map(b => {
          if (b.id !== blockId) return b;
          const gc = typeof b.content === 'object' && !Array.isArray(b.content)
            ? b.content as GalleryContent
            : { title: '', images: [] };
          return { ...b, content: { ...gc, title: newTitle } };
        }),
      };
    });
  };

  const addBlock = (type: BlockType) => {
    const initialContent = type === 'gallery' ? { title: '', images: [], height: 300 } : '';
    const newBlock: ContentBlock = { id: Date.now().toString(), type, content: initialContent };
    setEditingProject(prev => {
      if (!prev) return prev;
      if (focusedBlockId) {
        const anchorIdx = prev.blocks.findIndex(b => b.id === focusedBlockId);
        if (anchorIdx !== -1) {
          const updated = [...prev.blocks];
          updated.splice(anchorIdx + 1, 0, newBlock);
          return { ...prev, blocks: updated };
        }
      }
      return { ...prev, blocks: [...prev.blocks, newBlock] };
    });
    setFocusedBlockId(newBlock.id);
  };

  const updateBlockContent = (blockId: string, newContent: string) => {
    setEditingProject(prev => prev ? ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === blockId ? { ...b, content: newContent } : b),
    }) : prev);
  };

  const removeBlock = (blockId: string) => {
    if (focusedBlockId === blockId) setFocusedBlockId(null);
    setEditingProject(prev => prev ? ({ ...prev, blocks: prev.blocks.filter(b => b.id !== blockId) }) : prev);
  };

  const handleBlockDragStart = (e: React.DragEvent, idx: number) => {
    setBlockDrag(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleBlockDragEnter = (idx: number) => {
    if (blockDrag !== null && idx !== blockDrag) setBlockDragOver(idx);
  };
  const handleBlockDrop = (targetIdx: number) => {
    if (blockDrag === null || blockDrag === targetIdx || !editingProject) return;
    const arr = [...editingProject.blocks];
    const [moved] = arr.splice(blockDrag, 1);
    arr.splice(targetIdx, 0, moved);
    setEditingProject(prev => prev ? ({ ...prev, blocks: arr }) : prev);
    setBlockDrag(null);
    setBlockDragOver(null);
  };
  const handleBlockDragEnd = () => { setBlockDrag(null); setBlockDragOver(null); };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-fuchsia-400 dark:text-fuchsia-500 font-mono tracking-widest animate-pulse">MOUNTING EDITOR SYSTEM...</div>;
  }

  if (!editingProject) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32 animate-in fade-in duration-300 relative">

      {/* Manage tags modal */}
      {isManageTagsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={() => setIsManageTagsOpen(false)}>
          <div className="bg-[#001a2e] dark:bg-gray-900 border border-sky-300/30 dark:border-fuchsia-500/50 p-6 rounded-sm w-full max-w-md shadow-2xl backdrop-blur-2xl space-y-5" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-sky-300/10 dark:border-white/10 pb-3">
              <h3 className="text-lg font-serif text-white flex items-center gap-2">
                <Settings size={17} className="text-fuchsia-400" /> Manage Tags
              </h3>
              <button onClick={() => setIsManageTagsOpen(false)} className="text-sky-300/40 hover:text-white transition-colors p-1">
                <X size={16} />
              </button>
            </div>

            {/* Add new tag */}
            <div className="space-y-2">
              <label className="text-xs text-sky-300/60 dark:text-gray-400 uppercase font-mono tracking-wider">Add New Tag</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateNewTag()}
                  placeholder="e.g. Next.js, Docker, Selenium..."
                  className="flex-1 bg-black/40 border border-sky-300/20 dark:border-white/10 px-3 py-2 rounded-sm text-sm text-white focus:border-fuchsia-500 outline-none transition-all font-mono"
                  autoFocus
                />
                <button
                  onClick={handleCreateNewTag}
                  disabled={isCreatingTag || !newTagName.trim()}
                  className="px-4 py-2 bg-fuchsia-500 hover:bg-fuchsia-400 text-[#001320] font-bold rounded-sm transition-all disabled:opacity-40 shrink-0"
                >
                  {isCreatingTag ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                </button>
              </div>
            </div>

            {/* Tag list */}
            <div className="space-y-1.5">
              <p className="text-xs text-sky-300/50 dark:text-gray-500 uppercase font-mono tracking-wider">
                All Tags <span className="text-fuchsia-400">({availableTags.length})</span>
              </p>
              <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                {availableTags.length === 0 ? (
                  <p className="text-xs text-sky-200/25 font-mono italic py-6 text-center">No tags yet. Create one above.</p>
                ) : (
                  availableTags.map(tag => (
                    <div key={tag._id} className="flex items-center justify-between px-3 py-2.5 rounded-sm bg-white/5 border border-sky-300/10 dark:border-white/5 group hover:border-fuchsia-500/30 transition-all">
                      <div className="flex items-center gap-2 min-w-0">
                        <TagIcon size={12} className="text-fuchsia-400/60 shrink-0" />
                        <span className="text-sm text-sky-100 font-mono truncate">{tag.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteTag(tag._id)}
                        disabled={isDeletingTag === tag._id}
                        title="Delete tag"
                        className="text-sky-300/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40 shrink-0 ml-2"
                      >
                        {isDeletingTag === tag._id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-sky-300/10 dark:border-white/10">
              <button
                onClick={() => setIsManageTagsOpen(false)}
                className="px-5 py-2 text-xs font-mono font-bold tracking-widest text-sky-300/60 hover:text-white transition-colors"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STICKY HEADER */}
      <div className="sticky top-0 z-10 backdrop-blur-md pt-4 pb-4 border-b flex items-center justify-between bg-[#001320]/90 border-sky-400/30 dark:bg-gray-950/90 dark:border-fuchsia-500/30">
        <button onClick={handleBackToList} className="flex items-center gap-2 text-sky-200/50 hover:text-fuchsia-400 transition-colors text-xs font-mono tracking-widest">
          <ArrowLeft size={16} /> BACK TO ORBIT
        </button>
        {!isViewMode && (
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
        )}
      </div>

      {/* CORE INFO */}
      <section className="border p-6 rounded-sm space-y-6 backdrop-blur-md bg-white/5 border-sky-300/20 dark:bg-black/40 dark:border-white/10">
        <div className="space-y-2">
          <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase tracking-widest flex justify-between">
            COVER IMAGE
            {editingProject.coverImage && <span className="text-fuchsia-400">✓ Uploaded</span>}
          </label>
          <DragDropImageUpload
            imageUrl={editingProject.coverImage}
            isUploading={uploadingField === 'cover'}
            onFileDrop={handleCoverFileDrop}
            className="h-40"
          />
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

        {/* TAGS */}
        <div className="border-t border-sky-300/20 dark:border-white/5 pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase flex items-center gap-2">
              <TagIcon size={14} className="text-fuchsia-500" /> Project Tags
            </label>
            <button
              onClick={() => setIsManageTagsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500 hover:text-black transition-all rounded-sm text-xs font-mono"
            >
              <Settings size={14} /> MANAGE TAGS
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
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* DYNAMIC CONTENT BLOCKS */}
      <div className="space-y-4 pt-4">
        <h3 className="font-mono text-xs text-sky-300/60 dark:text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
          <Columns3 size={14} className="text-fuchsia-500" /> DYNAMIC CONTENT BLOCKS
        </h3>

        {editingProject.blocks.length === 0 && (
          <div className="text-center py-10 border border-dashed rounded-sm text-sky-200/30 border-sky-300/20 dark:border-white/10 dark:text-gray-500 text-sm font-mono">
            NO CONTENT BLOCKS. SELECT A TOOL BELOW TO BEGIN.
          </div>
        )}

        {editingProject.blocks.map((block, idx) => {
          const isDragging = blockDrag === idx;
          const isOver = blockDragOver === idx && blockDrag !== idx;
          return (
            <div
              key={block.id}
              onDragEnter={() => handleBlockDragEnter(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleBlockDrop(idx)}
              className={`relative overflow-visible transition-all duration-100 ${isDragging ? 'opacity-40 scale-[0.99]' : ''}`}
            >
              {isOver && blockDrag !== null && blockDrag > idx && (
                <div className="absolute -top-2 left-0 right-0 h-0.5 bg-fuchsia-400 rounded-full shadow-[0_0_8px_rgba(217,70,239,0.9)] z-10 pointer-events-none" />
              )}
              <div
                className={`relative group p-4 pl-10 rounded-sm transition-all pr-12 border bg-white/5 cursor-pointer ${
                  focusedBlockId === block.id
                    ? 'border-fuchsia-500/60 shadow-[0_0_14px_rgba(217,70,239,0.07)]'
                    : 'border-sky-300/10 hover:border-fuchsia-400/40 dark:border-white/5'
                }`}
                onClick={() => setFocusedBlockId(block.id)}
              >
                <div
                  draggable
                  onDragStart={(e) => handleBlockDragStart(e, idx)}
                  onDragEnd={handleBlockDragEnd}
                  className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab p-1.5 text-sky-300/20 opacity-0 group-hover:opacity-100 hover:text-fuchsia-400 transition-all select-none z-10"
                >
                  <GripVertical size={14} />
                </div>
                <button onClick={() => removeBlock(block.id)} className="absolute right-3 top-4 p-1.5 text-sky-300/30 hover:bg-red-500/20 hover:text-red-400 rounded-sm transition-all"><Trash2 size={16} /></button>

            {block.type === 'heading' && (
              <div className="space-y-2">
                <label className="text-[10px] text-fuchsia-400 font-mono tracking-widest uppercase">Heading</label>
                <input type="text" value={block.content as string} onChange={(e) => updateBlockContent(block.id, e.target.value)} placeholder="Enter heading..." className="w-full bg-transparent border-b pb-2 text-xl font-serif text-white border-sky-300/10 focus:border-fuchsia-500 outline-none transition-all" />
              </div>
            )}

            {block.type === 'paragraph' && (
              <div className="space-y-2">
                <label className="text-[10px] text-fuchsia-400 font-mono tracking-widest uppercase">Paragraph</label>
                <textarea rows={4} value={block.content as string} onChange={(e) => updateBlockContent(block.id, e.target.value)} placeholder="Write your project details here..." className="w-full bg-white/5 border p-3 rounded-sm text-sm text-sky-100 focus:border-fuchsia-500 outline-none transition-all resize-none border-sky-300/10 dark:bg-black/40 dark:text-gray-300" />
              </div>
            )}

            {block.type === 'link' && (
              <div className="space-y-2">
                <label className="text-[10px] text-fuchsia-400 font-mono tracking-widest uppercase">External Link</label>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3 top-3.5 text-sky-400/50" />
                  <input type="url" value={block.content as string} onChange={(e) => updateBlockContent(block.id, e.target.value)} placeholder="https://..." className="w-full bg-white/5 border pl-9 pr-3 py-3 rounded-sm text-sm text-blue-400 focus:border-fuchsia-500 outline-none transition-all font-mono border-sky-300/10 dark:bg-black/40" />
                </div>
              </div>
            )}

            {block.type === 'gallery' && (() => {
              const gc = block.content as GalleryContent;
              const images = gc?.images || [];
              const height = gc?.height ?? 300;
              return (
                <div className="space-y-4">
                  {/* Title + Height row */}
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] text-fuchsia-400 font-mono tracking-widest uppercase">Gallery Title</label>
                      <input
                        type="text"
                        value={gc?.title || ''}
                        onChange={(e) => handleUpdateGalleryTitle(block.id, e.target.value)}
                        placeholder="e.g. System Architecture Screenshots (Optional)"
                        className="w-full bg-white/5 border border-sky-300/20 dark:bg-black/40 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-fuchsia-500 outline-none transition-all"
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <label className="text-[10px] text-fuchsia-400 font-mono tracking-widest uppercase">Height (px)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step={10}
                          value={height}
                          onChange={(e) => handleUpdateGalleryHeight(block.id, Number(e.target.value))}
                          className="w-full bg-white/5 border border-sky-300/20 dark:bg-black/40 dark:border-white/10 p-3 pr-9 rounded-sm text-sm font-bold text-sky-100 dark:text-white focus:border-fuchsia-500 outline-none transition-all text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-fuchsia-400/60 font-mono pointer-events-none">px</span>
                      </div>
                    </div>
                  </div>

                  {/* Image thumbnail grid — drag-to-reorder + filesystem drop */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-fuchsia-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <GripVertical size={11} /> Images — drag to reorder, drop files to add
                    </label>
                    <div
                      className="flex flex-wrap gap-4 p-4 border rounded-sm bg-white/5 border-sky-300/10 dark:bg-black/30 dark:border-white/5 transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleGalleryAreaDrop(e, block.id)}
                    >
                      {images.map((img: string, idx: number) => {
                        const isDraggingThis = galleryDrag?.blockId === block.id && galleryDrag?.idx === idx;
                        const isDropTarget = galleryDragOver?.blockId === block.id && galleryDragOver?.idx === idx && galleryDrag?.idx !== idx;
                        return (
                          <div
                            key={idx}
                            draggable
                            onDragStart={() => handleGalleryImgDragStart(block.id, idx)}
                            onDragEnter={() => handleGalleryImgDragEnter(block.id, idx)}
                            onDragEnd={handleGalleryImgDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className={`w-24 h-24 border rounded-sm relative group/img cursor-grab transition-all select-none ${
                              isDraggingThis ? 'opacity-40 scale-95' : ''
                            } ${
                              isDropTarget ? 'ring-2 ring-fuchsia-400 border-fuchsia-400' : 'border-sky-300/10 dark:border-white/10'
                            } bg-white/5 dark:bg-black/60`}
                          >
                            <img src={img} alt="gallery" draggable={false} className="w-full h-full object-cover opacity-80 rounded-sm" />
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveGalleryImage(block.id, idx); }}
                              className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-500/90 hover:bg-red-500 text-white rounded-sm opacity-0 group-hover/img:opacity-100 transition-all"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        );
                      })}
                      {/* Add image button */}
                      <label className="w-24 h-24 border border-dashed border-fuchsia-500/50 hover:bg-fuchsia-500/10 rounded-sm flex flex-col items-center justify-center text-fuchsia-400 transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) handleGalleryFileDrop(Array.from(e.target.files), block.id);
                            e.target.value = '';
                          }}
                        />
                        {uploadingField === block.id ? <Loader2 size={20} className="animate-spin" /> : <><Plus size={20} /><span className="text-[8px] font-mono mt-1">ADD IMAGE</span></>}
                      </label>
                    </div>
                  </div>

                  {/* Live preview strip */}
                  {images.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[10px] text-fuchsia-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
                        <Eye size={11} /> Preview — {height}px
                      </label>
                      <div className="flex gap-3 overflow-x-auto p-4 border rounded-sm bg-black/50 border-fuchsia-500/20 custom-scrollbar">
                        {images.map((img: string, idx: number) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`preview-${idx}`}
                            style={{ height: `${height}px` }}
                            className="object-cover rounded-sm border border-white/10 shrink-0 max-w-none"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
              </div>
              {focusedBlockId === block.id && (
                <div className="flex items-center gap-2 px-3 py-1.5 pointer-events-none">
                  <div className="flex-1 border-t border-dashed border-fuchsia-500/25" />
                  <span className="text-[9px] font-mono text-fuchsia-400/40 tracking-widest shrink-0">↓ NEW BLOCK INSERTS HERE</span>
                  <div className="flex-1 border-t border-dashed border-fuchsia-500/25" />
                </div>
              )}
              {isOver && blockDrag !== null && blockDrag < idx && (
                <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-fuchsia-400 rounded-full shadow-[0_0_8px_rgba(217,70,239,0.9)] z-10 pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      {/* BOTTOM TOOLBAR — add block types */}
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
