'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Terminal, Calendar, Loader2, Save, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';

export default function ProjectsAdmin() {
  const defaultSectorData = { title: '[ CONSTELLATION ]', description: 'A stellar map of my complete projects.' };

  const [sectorData, setSectorData] = useState(defaultSectorData);
  const [originalFull, setOriginalFull] = useState<{ sectorData: typeof defaultSectorData; projectOrder: string[] }>({
    sectorData: defaultSectorData,
    projectOrder: [],
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [tagsDict, setTagsDict] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Drag-to-reorder state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const { setUnsavedPath, isViewMode } = useAdmin();
  const { showToast } = useToast();
  const openConfirm = useConfirm();

  // Current order of project IDs
  const currentOrder = projects.map(p => p._id || p.id);
  const hasChanges =
    JSON.stringify(sectorData) !== JSON.stringify(originalFull.sectorData) ||
    JSON.stringify(currentOrder) !== JSON.stringify(originalFull.projectOrder);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metaRes, tagsRes, projRes] = await Promise.all([
          fetch('/api/projects/meta'),
          fetch('/api/tags'),
          fetch('/api/projects'),
        ]);

        let metaSectorData = defaultSectorData;
        let savedOrder: string[] = [];

        if (metaRes.ok) {
          const metaData = await metaRes.json();
          if (metaData?.sectorData) metaSectorData = metaData.sectorData;
          if (metaData?.projectOrder?.length) savedOrder = metaData.projectOrder;
        }

        if (tagsRes.ok) {
          const tagsList = await tagsRes.json();
          const dict: Record<string, string> = {};
          tagsList.forEach((t: any) => { dict[t._id] = t.name; });
          setTagsDict(dict);
        }

        if (projRes.ok) {
          const projData = await projRes.json();
          // Apply saved order if available
          const sorted = savedOrder.length
            ? [...projData].sort((a, b) => {
                const ai = savedOrder.indexOf(a._id);
                const bi = savedOrder.indexOf(b._id);
                if (ai === -1) return 1;
                if (bi === -1) return -1;
                return ai - bi;
              })
            : projData;
          setProjects(sorted);

          const order = sorted.map((p: any) => p._id || p.id);
          setSectorData(metaSectorData);
          setOriginalFull({ sectorData: metaSectorData, projectOrder: order });
        }
      } catch (error) {
        showToast('Failed to load constellation data', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setUnsavedPath('/admin/projects', hasChanges);
  }, [hasChanges, setUnsavedPath]);

  const handleSaveAll = async () => {
    if (isViewMode) return;
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/projects/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorData, projectOrder: currentOrder }),
      });
      if (!res.ok) throw new Error('Save failed');
      setOriginalFull({ sectorData, projectOrder: currentOrder });
      showToast('Constellation synchronized! 🪐', 'success');
    } catch (error) {
      showToast('Failed to save.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    if (isViewMode) return;
    e.preventDefault();
    e.stopPropagation();
    if (!await openConfirm({ title: 'Delete Project', message: 'Are you sure you want to delete this project?', variant: 'danger', confirmLabel: 'DELETE' })) return;
    const newProjects = projects.filter(p => (p._id !== id && p.id !== id));
    setProjects(newProjects);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      const newOrder = newProjects.map((p: any) => p._id || p.id);
      setOriginalFull(prev => ({ ...prev, projectOrder: newOrder }));
      showToast('Project deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete project', 'error');
    }
  };

  // Drag-to-reorder handlers
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnter = (idx: number) => {
    if (dragIdx !== null && idx !== dragIdx) setDragOverIdx(idx);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const newProjects = [...projects];
    const [moved] = newProjects.splice(dragIdx, 1);
    newProjects.splice(targetIdx, 0, moved);
    setProjects(newProjects);
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-fuchsia-400 dark:text-fuchsia-500 font-mono tracking-widest animate-pulse">SCANNING CONSTELLATION...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">

      {/* STICKY TOPBAR */}
      <div className="sticky top-0 z-30 backdrop-blur-md -mx-6 md:-mx-10 px-6 md:px-10 pt-4 pb-4 border-b flex items-center justify-between bg-[#001320]/90 border-sky-400/30 dark:bg-gray-950/90 dark:border-fuchsia-500/30">
        <div>
          <h1 className="text-2xl font-serif text-sky-100 dark:text-white">Constellation Mapping</h1>
          <p className="text-[10px] text-fuchsia-400 tracking-widest mt-0.5">[ MANAGE PROJECTS ]</p>
        </div>
        {!isViewMode && (
          <button
            onClick={handleSaveAll}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-2 px-5 py-2 font-bold text-xs tracking-widest rounded-sm transition-all border ${
              hasChanges
                ? 'bg-fuchsia-500 border-fuchsia-400 text-[#001320] shadow-[0_0_15px_rgba(217,70,239,0.3)] cursor-pointer'
                : 'bg-white/5 border-sky-300/20 dark:border-white/10 text-sky-200/40 cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'SAVING...' : hasChanges ? 'SAVE ALL' : 'UP TO DATE'}
          </button>
        )}
      </div>

      {/* SECTOR DETAILS (inputs only, no save button) */}
      <section className="p-6 rounded-sm space-y-4 backdrop-blur-md bg-white/5 border border-sky-300/20 dark:bg-black/40 dark:border-white/10">
        <h2 className="text-sm font-serif text-white flex items-center gap-2 border-b border-sky-300/20 dark:border-white/10 pb-3">
          <Terminal size={16} className="text-fuchsia-400" /> Sector Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Sector Title</label>
            <input type="text" value={sectorData.title} onChange={(e) => setSectorData(p => ({ ...p, title: e.target.value }))} className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-fuchsia-500 outline-none transition-all font-mono" />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Sector Description</label>
            <input type="text" value={sectorData.description} onChange={(e) => setSectorData(p => ({ ...p, description: e.target.value }))} className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-fuchsia-500 outline-none transition-all" />
          </div>
        </div>
      </section>

      {/* PROJECTS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs text-sky-300/60 dark:text-gray-400 tracking-widest uppercase">
            Projects ({projects.length}) — drag <GripVertical size={12} className="inline" /> to reorder
          </h3>
          <Link href="/admin/projects/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-fuchsia-500 hover:bg-fuchsia-400 text-[#001320] font-bold text-xs tracking-widest rounded-sm transition-all shadow-[0_0_10px_rgba(217,70,239,0.2)]">
              <Plus size={14} /> NEW PROJECT
            </button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="py-10 text-center text-sky-200/40 border border-dashed border-sky-300/20 dark:border-white/10 dark:text-gray-500 font-mono text-sm">
            NO PROJECTS FOUND. CREATE ONE TO START.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj, index) => {
              const targetId = proj._id || proj.id;
              const safeKey = `${targetId || 'proj'}-${index}`;
              const isDragging = dragIdx === index;
              const isOver = dragOverIdx === index && dragIdx !== index;

              return (
                <div
                  key={safeKey}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className={`group relative rounded-sm overflow-visible transition-all duration-150 ${isDragging ? 'opacity-40 scale-95' : ''}`}
                >
                  {isOver && dragIdx !== null && dragIdx > index && (
                    <div className="absolute -top-3 left-0 right-0 h-0.5 bg-fuchsia-400 rounded-full shadow-[0_0_8px_rgba(217,70,239,0.9)] z-10 pointer-events-none" />
                  )}
                  {/* Drag handle */}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    className="absolute top-2 left-2 z-20 cursor-grab p-1.5 rounded-sm bg-black/50 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white transition-all select-none"
                  >
                    <GripVertical size={14} />
                  </div>

                  <Link href={`/admin/projects/${targetId}`}>
                    <div className="rounded-sm overflow-hidden cursor-pointer transition-all flex flex-col h-80 bg-white/5 border border-sky-300/20 hover:border-fuchsia-400 dark:bg-black/40 dark:border-white/10 dark:hover:border-fuchsia-500/50">
                      <div className="h-40 border-b flex items-center justify-center relative overflow-hidden shrink-0 bg-sky-950/10 border-sky-300/10 dark:bg-fuchsia-950/20 dark:border-white/10">
                        {proj.coverImage ? (
                          <img src={proj.coverImage} alt="cover" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <ImageIcon size={32} className="text-fuchsia-500/30" />
                        )}
                        <button
                          onClick={(e) => handleDeleteProject(e, targetId)}
                          className="absolute top-2 right-2 p-2 bg-black/60 text-gray-400 hover:text-red-400 rounded-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="p-4 flex flex-col flex-1 justify-between">
                        <div>
                          <h3 className="font-serif text-white text-lg line-clamp-1">{proj.title}</h3>
                          <div className="flex items-center gap-1.5 text-xs font-mono text-fuchsia-400 mt-2 mb-3">
                            <Calendar size={12} /> {proj.time}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {proj.tags?.slice(0, 3).map((tagId: string) => (
                              <span key={tagId} className="text-[9px] font-mono px-2 py-0.5 border rounded-sm bg-fuchsia-500/5 border-fuchsia-400/30 text-fuchsia-300">
                                {tagsDict[tagId] || tagId}
                              </span>
                            ))}
                            {(proj.tags?.length || 0) > 3 && (
                              <span className="text-[9px] font-mono px-2 py-0.5 text-sky-300/40">+{proj.tags.length - 3}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] font-mono flex gap-2 mt-4 text-sky-300/50 dark:text-gray-500">
                          <span>{proj.blocks?.length || 0} BLOCKS</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  {isOver && dragIdx !== null && dragIdx < index && (
                    <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-fuchsia-400 rounded-full shadow-[0_0_8px_rgba(217,70,239,0.9)] z-10 pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
