'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Briefcase, Terminal, Loader2, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useThemeStore } from '@/lib/store/useThemeStore';

interface ExperienceItem {
  _id?: string;
  id?: string;
  title: string;
  time: string;
  details: string[];
}

export default function ExperienceAdmin() {
  const defaultSectorData = {
    title: '[ CHRONO-RING ]',
    description: 'A chronological telemetry log of my professional milestones and technical journey.',
  };

  const [sectorData, setSectorData] = useState(defaultSectorData);
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);

  const [originalFull, setOriginalFull] = useState<{ sectorData: typeof defaultSectorData; experiences: ExperienceItem[] }>({
    sectorData: defaultSectorData,
    experiences: [],
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
    JSON.stringify(experiences) !== JSON.stringify(originalFull.experiences);

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        const res = await fetch('/api/experience');
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            const sd = data.sectorData || defaultSectorData;
            const ex = data.experiences || [];
            setSectorData(sd);
            setExperiences(ex);
            setOriginalFull({ sectorData: sd, experiences: ex });
          }
        }
      } catch (error) {
        showToast('Failed to load Chrono-Ring data.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTimelineData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setUnsavedPath('/admin/experience', hasChanges);
  }, [hasChanges, setUnsavedPath]);

  const handleSaveAll = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorData, experiences }),
      });
      if (!res.ok) throw new Error('Save failed');
      setOriginalFull({ sectorData, experiences });
      showToast('Chrono-Ring synchronized! 🔵', 'success');
    } catch (error) {
      showToast('Transmission failed.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExperience = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!await openConfirm({ title: 'Delete Record', message: 'Are you sure you want to delete this temporal record?', variant: 'danger', confirmLabel: 'DELETE' })) return;

    const newExperiences = experiences.filter(exp => (exp._id !== id && exp.id !== id));
    setExperiences(newExperiences);

    try {
      const res = await fetch('/api/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorData, experiences: newExperiences }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setOriginalFull({ sectorData, experiences: newExperiences });
      showToast('Temporal record deleted successfully.', 'success');
    } catch (error) {
      showToast('Failed to delete record from database.', 'error');
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
    const newExps = [...experiences];
    const [moved] = newExps.splice(dragIdx, 1);
    newExps.splice(targetIdx, 0, moved);
    setExperiences(newExps);
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-cyan-400 dark:text-cyan-500 font-mono tracking-widest animate-pulse">CALIBRATING CHRONO-RING...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">

      {/* STICKY TOPBAR */}
      <div className="sticky top-0 z-10 backdrop-blur-md pt-4 pb-4 border-b flex items-center justify-between bg-[#001320]/90 border-sky-400/30 dark:bg-gray-950/90 dark:border-cyan-500/30">
        <div>
          <h1 className="text-2xl font-serif text-sky-100 dark:text-white">Chrono-Ring Calibration</h1>
          <p className="text-[10px] text-cyan-400 tracking-widest mt-0.5">[ MANAGE TIMELINE EXPERIENCE ]</p>
        </div>
        {!isViewMode && (
          <button
            onClick={handleSaveAll}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-2 px-5 py-2 font-bold text-xs tracking-widest rounded-sm transition-all border ${
              hasChanges
                ? 'bg-cyan-500 border-cyan-400 text-[#001320] shadow-[0_0_15px_rgba(34,211,238,0.3)] cursor-pointer'
                : 'bg-white/5 border-sky-300/20 dark:border-white/10 text-sky-200/40 cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'SAVING...' : hasChanges ? 'SAVE ALL' : 'UP TO DATE'}
          </button>
        )}
      </div>

      {/* SECTOR DETAILS (inputs only) */}
      <section className="p-6 rounded-sm space-y-4 backdrop-blur-md bg-white/5 border border-sky-300/20 dark:bg-cyan-950/10 dark:border-white/10">
        <h2 className="text-sm font-serif text-white flex items-center gap-2 border-b border-sky-300/20 dark:border-white/10 pb-3">
          <Terminal size={16} className="text-cyan-400" /> Sector Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-sky-200/60 dark:text-cyan-500 font-mono uppercase">Sector Title</label>
            <input type="text" value={sectorData.title} onChange={(e) => setSectorData(p => ({ ...p, title: e.target.value }))} className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-cyan-500 outline-none transition-all font-mono" />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs text-sky-200/60 dark:text-cyan-500 font-mono uppercase">Sector Description</label>
            <input type="text" value={sectorData.description} onChange={(e) => setSectorData(p => ({ ...p, description: e.target.value }))} className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-cyan-500 outline-none transition-all" />
          </div>
        </div>
      </section>

      {/* TIMELINE EXPERIENCE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs text-sky-300/60 dark:text-gray-400 tracking-widest uppercase">
            Timeline Blocks ({experiences.length}) — drag <GripVertical size={12} className="inline" /> to reorder
          </h3>
          <Link href="/admin/experience/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#001320] font-bold text-xs tracking-widest rounded-sm transition-all shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              <Plus size={14} /> NEW RECORD
            </button>
          </Link>
        </div>

        {experiences.length === 0 ? (
          <div className="text-center py-10 rounded-sm text-sky-200/40 border border-dashed border-sky-300/20 dark:border-white/10 dark:text-gray-500 font-mono text-sm italic">
            NO TIMELINE LOGS DETECTED.
          </div>
        ) : (
          <div className="relative border-l pl-6 ml-3 space-y-4 border-sky-500/20 dark:border-cyan-500/20">
            {experiences.map((exp, index) => {
              const safeKey = `${exp._id || exp.id || 'exp'}-${index}`;
              const targetUrl = `/admin/experience/${exp._id || exp.id}`;
              const isDragging = dragIdx === index;
              const isOver = dragOverIdx === index && dragIdx !== index;

              return (
                <div
                  key={safeKey}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className={`relative group transition-all duration-150 ${isDragging ? 'opacity-40 scale-[0.99]' : ''}`}
                >
                  {/* Insertion line – above (dragging from below) */}
                  {isOver && dragIdx !== null && dragIdx > index && (
                    <div className="absolute -top-2.5 left-0 right-0 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.9)] z-10 pointer-events-none" />
                  )}
                  {/* Timeline dot */}
                  <span className={`absolute -left-7.75 top-6 w-2 h-2 rounded-full transition-transform group-hover:scale-125 ${
                    isLight ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                  }`} />

                  <div className="border p-5 rounded-sm flex items-start gap-2 group-hover:border-cyan-400 transition-all backdrop-blur-md bg-white/5 border-sky-300/20 dark:bg-black/40 dark:border-white/10 dark:group-hover:border-cyan-500/50">
                    {/* Drag handle */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab pt-1 text-sky-300/20 opacity-0 group-hover:opacity-100 hover:text-cyan-400 transition-all select-none shrink-0"
                    >
                      <GripVertical size={16} />
                    </div>

                    {/* Content */}
                    <Link href={targetUrl} className="flex-1 block">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-4">
                          <h4 className="text-lg text-white font-serif flex items-center gap-2">
                            <Briefcase size={16} className="text-cyan-400" /> {exp.title}
                          </h4>
                          <span className="font-mono text-[10px] border px-2 py-0.5 rounded-sm bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                            {exp.time}
                          </span>
                        </div>

                        <ul className="space-y-1.5 pl-1">
                          {exp.details.slice(0, 3).map((detail, i) => (
                            <li key={i} className={`flex gap-2 text-xs font-mono ${isLight ? 'text-sky-200/80' : 'text-gray-400'}`}>
                              <span className="text-cyan-500">›</span>
                              <span className="line-clamp-1">{detail}</span>
                            </li>
                          ))}
                          {exp.details.length > 3 && (
                            <li className="text-xs font-mono text-cyan-500/50 italic pl-4">...and {exp.details.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    </Link>

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDeleteExperience(exp._id || exp.id!, e)}
                      className="p-2 border text-sky-200/30 border-sky-300/10 hover:text-red-400 hover:bg-red-500/5 rounded-sm opacity-0 group-hover:opacity-100 transition-all self-start shrink-0 dark:border-white/5 dark:text-gray-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {/* Insertion line – below (dragging from above) */}
                  {isOver && dragIdx !== null && dragIdx < index && (
                    <div className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.9)] z-10 pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
