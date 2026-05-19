'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Cpu, Terminal, Loader2, FolderGit2, Save, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useThemeStore } from '@/lib/store/useThemeStore';

export default function ServicesAdmin() {
  const defaultSectorData = {
    title: '[ ENERGY HUB ]',
    description: 'Specialized services engineered to bridge complex technical domains.',
  };

  const [sectorData, setSectorData] = useState(defaultSectorData);
  const [services, setServices] = useState<any[]>([]);

  const [originalFull, setOriginalFull] = useState<{ sectorData: typeof defaultSectorData; services: any[] }>({
    sectorData: defaultSectorData,
    services: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Drag-to-reorder state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const { setUnsavedPath, isViewMode } = useAdmin();
  const { showToast } = useToast();
  const openConfirm = useConfirm();
  const theme = useThemeStore((s) => s.theme);
  const isLight = theme === 'light';

  const hasChanges =
    JSON.stringify(sectorData) !== JSON.stringify(originalFull.sectorData) ||
    JSON.stringify(services) !== JSON.stringify(originalFull.services);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            const sd = data.sectorData || defaultSectorData;
            const sv = data.services || [];
            setSectorData(sd);
            setServices(sv);
            setOriginalFull({ sectorData: sd, services: sv });
          }
        }
      } catch (error) {
        showToast('Failed to load Energy Hub data.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setUnsavedPath('/admin/services', hasChanges);
  }, [hasChanges, setUnsavedPath]);

  const handleSaveAll = async () => {
    if (isViewMode) return;
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorData, services }),
      });
      if (!res.ok) throw new Error('Save failed');
      setOriginalFull({ sectorData, services });
      showToast('Energy Hub synchronized! 🟡', 'success');
    } catch (error) {
      showToast('Transmission failed.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteService = async (id: string, e: React.MouseEvent) => {
    if (isViewMode) return;
    e.preventDefault();
    e.stopPropagation();
    if (!await openConfirm({ title: 'Delete Service', message: 'Are you sure you want to delete this service stream?', variant: 'danger', confirmLabel: 'DELETE' })) return;

    const newServices = services.filter(s => (s._id !== id && s.id !== id));
    setServices(newServices);

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorData, services: newServices }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setOriginalFull({ sectorData, services: newServices });
      showToast('Service stream deleted successfully.', 'success');
    } catch (error) {
      showToast('Failed to delete service from database.', 'error');
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
    const newServices = [...services];
    const [moved] = newServices.splice(dragIdx, 1);
    newServices.splice(targetIdx, 0, moved);
    setServices(newServices);
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-amber-400 dark:text-amber-500 font-mono tracking-widest animate-pulse">SYNCHRONIZING ENERGY HUB...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">

      {/* STICKY TOPBAR */}
      <div className="sticky top-0 z-30 backdrop-blur-md -mx-6 md:-mx-10 px-6 md:px-10 pt-4 pb-4 border-b flex items-center justify-between bg-[#001320]/90 border-sky-400/30 dark:bg-gray-950/90 dark:border-amber-500/30">
        <div>
          <h1 className="text-2xl font-serif text-sky-100 dark:text-white">Services Configuration</h1>
          <p className="text-[10px] text-amber-400 tracking-widest mt-0.5">[ MANAGE ENERGY HUB STREAMS ]</p>
        </div>
        {!isViewMode && (
          <button
            onClick={handleSaveAll}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-2 px-5 py-2 font-bold text-xs tracking-widest rounded-sm transition-all border ${
              hasChanges
                ? 'bg-amber-500 border-amber-400 text-[#001320] shadow-[0_0_15px_rgba(234,179,8,0.3)] cursor-pointer'
                : 'bg-white/5 border-sky-300/20 dark:border-white/10 text-sky-200/40 cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'SAVING...' : hasChanges ? 'SAVE ALL' : 'UP TO DATE'}
          </button>
        )}
      </div>

      {/* SECTOR DETAILS (inputs only) */}
      <section className="p-6 rounded-sm space-y-4 backdrop-blur-md bg-white/5 border border-sky-300/20 dark:bg-amber-950/10 dark:border-white/10">
        <h2 className="text-sm font-serif text-white flex items-center gap-2 border-b border-sky-300/20 dark:border-white/10 pb-3">
          <Terminal size={16} className="text-amber-400" /> Sector Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-sky-200/60 dark:text-amber-500 uppercase font-mono">Sector Title</label>
            <input type="text" value={sectorData.title} onChange={(e) => setSectorData(p => ({ ...p, title: e.target.value }))} className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-amber-500 outline-none transition-all font-mono" />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs text-sky-200/60 dark:text-amber-500 uppercase font-mono">Sector Description</label>
            <input type="text" value={sectorData.description} onChange={(e) => setSectorData(p => ({ ...p, description: e.target.value }))} className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-amber-500 outline-none transition-all" />
          </div>
        </div>
      </section>

      {/* SERVICE CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs text-sky-300/60 dark:text-gray-400 tracking-widest uppercase">
            Services ({services.length}) — drag <GripVertical size={12} className="inline" /> to reorder
          </h3>
          <Link href="/admin/services/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#001320] font-bold text-xs tracking-widest rounded-sm transition-all shadow-[0_0_10px_rgba(234,179,8,0.2)]">
              <Plus size={14} /> NEW SERVICE STREAM
            </button>
          </Link>
        </div>

        {services.length === 0 ? (
          <div className="py-10 text-center text-sky-200/40 dark:text-gray-500 font-mono text-sm border border-dashed border-sky-300/20 dark:border-white/10">
            NO SERVICES ACTIVE. INITIALIZE ONE TO START.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {services.map((svc, index) => {
              const safeKey = `${svc._id || svc.id || 'svc'}-${index}`;
              const targetUrl = `/admin/services/${svc._id || svc.id}`;
              const isDragging = dragIdx === index;
              const isOver = dragOverIdx === index && dragIdx !== index;

              return (
                <div
                  key={safeKey}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className={`group relative transition-all duration-150 rounded-sm ${isDragging ? 'opacity-40 scale-[0.99]' : ''}`}
                >
                  {isOver && dragIdx !== null && dragIdx > index && (
                    <div className="absolute -top-2.5 left-0 right-0 h-0.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.9)] z-10 pointer-events-none" />
                  )}
                  {/* Drag handle */}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 cursor-grab p-1.5 rounded-sm text-sky-300/20 opacity-0 group-hover:opacity-100 hover:text-amber-400 transition-all select-none"
                  >
                    <GripVertical size={16} />
                  </div>

                  <Link href={targetUrl}>
                    <div className="border p-5 pl-10 rounded-sm flex items-start justify-between gap-4 cursor-pointer transition-all backdrop-blur-md h-full bg-white/5 border-sky-300/20 hover:border-amber-400 dark:bg-black/40 dark:border-white/10 dark:hover:border-amber-500/50">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-amber-500/10 rounded-sm text-amber-400 shrink-0">
                            <Cpu size={16} />
                          </div>
                          <h4 className="text-md text-white font-serif">{svc.title}</h4>
                        </div>

                        <div className="max-h-28 overflow-y-auto custom-scrollbar pr-2">
                          <p className={`text-xs leading-relaxed whitespace-pre-line wrap-break-word ${isLight ? 'text-sky-200/80' : 'text-gray-400'}`}>
                            {svc.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-sky-300/10 dark:border-white/5">
                          <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                            <FolderGit2 size={12} /> LINKED PROJECTS: {svc.linkedProjectIds?.length || 0}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteService(svc._id || svc.id, e)}
                        className="p-2 border border-sky-300/10 text-sky-200/30 hover:text-red-400 hover:bg-red-500/5 rounded-sm opacity-0 group-hover:opacity-100 transition-all shrink-0 dark:border-white/5 dark:text-gray-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Link>
                  {isOver && dragIdx !== null && dragIdx < index && (
                    <div className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.9)] z-10 pointer-events-none" />
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
