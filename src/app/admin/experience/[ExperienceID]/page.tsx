'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, ArrowLeft, Calendar, ListPlus, X, Loader2, GripVertical, Plus } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useThemeStore } from '@/lib/store/useThemeStore'; // 🌟 1. นำเข้าระบบตรวจสอบธีมกลาง

interface ExperienceItem {
  _id?: string;
  id?: string;
  title: string;
  time: string;
  details: string[];
}

export default function SingleExperiencePage() {
  const router = useRouter();
  const params = useParams();
  const experienceId = params.ExperienceID as string;

  const [fullData, setFullData] = useState<{ sectorData: any, experiences: ExperienceItem[] } | null>(null);
  const [editingExp, setEditingExp] = useState<ExperienceItem | null>(null);
  const [originalExp, setOriginalExp] = useState<ExperienceItem | null>(null);
  
  const [currentPointInput, setCurrentPointInput] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [detailDrag, setDetailDrag] = useState<number | null>(null);
  const [detailDragOver, setDetailDragOver] = useState<number | null>(null);
  
  const { setUnsavedPath, isViewMode } = useAdmin();
  const { showToast } = useToast();
  const openConfirm = useConfirm();
  const theme = useThemeStore((s) => s.theme); // 🌟 2. เรียกใช้งานสถานะธีม
  const isLight = theme === 'light';

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await fetch('/api/experience');
        if (res.ok) {
          const data = await res.json();
          setFullData(data);
          
          if (experienceId === 'new') {
            const newExp: ExperienceItem = { id: Date.now().toString(), title: '', time: '', details: [] };
            setEditingExp(newExp);
            setOriginalExp(newExp);
          } else {
            const target = data.experiences?.find((e: any) => e._id === experienceId || e.id === experienceId);
            if (target) {
              setEditingExp(target);
              setOriginalExp(target);
            } else {
              showToast('Timeline record not found.', 'error');
              router.push('/admin/experience');
            }
          }
        }
      } catch (error) {
        showToast('Connection failed.', 'error');
        router.push('/admin/experience');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeline();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experienceId, router]);

  useEffect(() => {
    if (!editingExp || !originalExp) return;
    const isChanged = JSON.stringify(editingExp) !== JSON.stringify(originalExp);
    setHasChanges(isChanged);
    setUnsavedPath('/admin/experience', isChanged); 
  }, [editingExp, originalExp, setUnsavedPath]);

  const handleAddPoint = () => {
    if (isViewMode) return;
    const point = currentPointInput.trim();
    if (!point || !editingExp) return;
    setEditingExp(prev => prev ? ({ ...prev, details: [...prev.details, point] }) : prev);
    setCurrentPointInput('');
  };

  const handleRemovePoint = (indexToRemove: number) => {
    if (isViewMode) return;
    if (!editingExp) return;
    setEditingExp(prev => prev ? ({ ...prev, details: prev.details.filter((_, idx) => idx !== indexToRemove) }) : prev);
  };

  const handleEditDetail = (idx: number, value: string) => {
    if (!editingExp) return;
    const updated = [...editingExp.details];
    updated[idx] = value;
    setEditingExp(prev => prev ? ({ ...prev, details: updated }) : prev);
  };

  const handleDetailDragStart = (e: React.DragEvent, idx: number) => {
    setDetailDrag(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDetailDragEnter = (idx: number) => {
    if (detailDrag !== null && idx !== detailDrag) setDetailDragOver(idx);
  };
  const handleDetailDrop = (targetIdx: number) => {
    if (detailDrag === null || detailDrag === targetIdx || !editingExp) return;
    const arr = [...editingExp.details];
    const [moved] = arr.splice(detailDrag, 1);
    arr.splice(targetIdx, 0, moved);
    setEditingExp(prev => prev ? ({ ...prev, details: arr }) : prev);
    setDetailDrag(null);
    setDetailDragOver(null);
  };
  const handleDetailDragEnd = () => { setDetailDrag(null); setDetailDragOver(null); };

  const handleSaveExperience = async () => {
    if (isViewMode) return;
    if (!editingExp || !hasChanges || !fullData) return;
    setIsSaving(true);
    
    try {
      let newExpList = [...(fullData.experiences || [])];
      const existingIndex = editingExp._id
        ? newExpList.findIndex(e => e._id === editingExp._id)
        : -1;
      
      if (existingIndex >= 0) {
        newExpList[existingIndex] = editingExp; 
      } else {
        newExpList.unshift(editingExp); 
      }

      const res = await fetch('/api/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorData: fullData.sectorData, experiences: newExpList }),
      });

      if (!res.ok) throw new Error('Failed to save experience');
      
      setUnsavedPath('/admin/experience', false);
      showToast('Temporal record synchronized! 🔵', 'success');
      router.push('/admin/experience');
    } catch (error) {
      showToast('Transmission failed.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToList = async () => {
    if (hasChanges && !await openConfirm({ title: 'Unsaved Changes', message: 'You have unsaved changes. Leave without saving?', variant: 'warning', confirmLabel: 'LEAVE' })) return;
    setUnsavedPath('/admin/experience', false);
    router.push('/admin/experience');
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-cyan-400 font-mono tracking-widest animate-pulse">MOUNTING CHRONO EDITOR...</div>;
  }

  if (!editingExp) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32 animate-in fade-in duration-300">
      
      {/* STICKY HEADER CONTROLS */}
      {/* 🌟 [FIXED] ดึงสไตล์สติ๊กกี้สีอวกาศห้วงลึกของรถส้มทองมาใช้กับขั้วระบบโครโน่ */}
      <div className="sticky top-0 z-50 will-change-transform backdrop-blur-md -mx-6 md:-mx-10 px-6 md:px-10 pt-4 pb-4 border-b flex items-center justify-between bg-[#001320]/90 border-sky-400/30 dark:bg-gray-950/90 dark:border-cyan-500/30">
        <button onClick={handleBackToList} className="flex items-center gap-2 text-sky-200/50 hover:text-cyan-500 transition-colors text-xs font-mono tracking-widest dark:text-gray-400">
          <ArrowLeft size={16} /> BACK TO ORBIT
        </button>
        {!isViewMode && (
          <button
            onClick={handleSaveExperience}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-2 px-6 py-2 font-bold text-xs tracking-widest rounded-sm transition-all border ${
              hasChanges
                ? 'bg-cyan-500 border-cyan-400 text-[#001320] shadow-[0_0_15px_rgba(34,211,238,0.3)] cursor-pointer'
                : 'bg-white/5 border-sky-300/20 text-sky-200/40 dark:border-white/10 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'SAVING...' : hasChanges ? 'COMMIT RECORD' : 'UP TO DATE'}
          </button>
        )}
      </div>

      {/* CORE FORM MATRIX */}
      <section className="border p-6 rounded-sm space-y-6 backdrop-blur-md bg-white/5 border-sky-300/20 dark:bg-black/40 dark:border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Experience Title</label>
            <input 
              type="text" placeholder="e.g. Automation Specialist at Space Corp"
              value={editingExp.title}
              onChange={(e) => setEditingExp({ ...editingExp, title: e.target.value })}
              className="w-full bg-white/5 border border-sky-300/20 dark:bg-black/40 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-cyan-500 outline-none transition-all" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Timeline Frame</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-4 text-sky-400/50 dark:text-gray-500" />
              <input 
                type="text" placeholder="e.g. 2025 - 2026 หรือ JAN - PRESENT"
                value={editingExp.time}
                onChange={(e) => setEditingExp({ ...editingExp, time: e.target.value })}
                className="w-full bg-white/5 border border-sky-300/20 dark:bg-black/40 dark:border-white/10 pl-9 pr-3 py-3 rounded-sm text-sm text-cyan-300 focus:border-cyan-500 outline-none transition-all font-mono" 
              />
            </div>
          </div>
        </div>

        {/* DYNAMIC DETAIL MATRIX SUB-CARD */}
        <div className="p-4 rounded-sm space-y-4 border bg-white/5 border-sky-300/10 dark:border-white/5 dark:bg-black/20">
          <div className="flex items-center justify-between">
            <label className="text-xs tracking-wider flex items-center gap-1.5 font-mono text-sky-200/60 dark:text-gray-400">
              <ListPlus size={14} className="text-cyan-500" />
              DYNAMIC DETAIL MATRIX
              <span className="text-sky-300/30 dark:text-gray-600">({editingExp.details.length})</span>
            </label>
            {editingExp.details.length > 1 && (
              <span className="text-[10px] font-mono text-sky-300/30 dark:text-gray-600">drag <GripVertical size={10} className="inline" /> to reorder</span>
            )}
          </div>

          {/* Add input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add responsibility or achievement, then press Enter..."
              value={currentPointInput}
              onChange={(e) => setCurrentPointInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPoint())}
              className="flex-1 bg-white/5 border border-sky-300/20 px-3 py-2 rounded-sm text-xs text-sky-100 focus:border-cyan-400 dark:bg-black/60 dark:border-white/10 outline-none transition-all font-mono"
            />
            <button
              type="button" onClick={handleAddPoint}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-sky-300/20 dark:border-white/10 text-xs text-cyan-400 hover:bg-cyan-500/20 transition-all font-mono rounded-sm shrink-0"
            >
              <Plus size={13} /> ADD
            </button>
          </div>

          {/* Detail list */}
          {editingExp.details.length > 0 && (
            <ul className="space-y-1.5 pt-2 border-t border-sky-300/10 dark:border-white/5">
              {editingExp.details.map((pt, idx) => {
                const isDragging = detailDrag === idx;
                const isOver = detailDragOver === idx && detailDrag !== idx;
                return (
                  <li
                    key={idx}
                    onDragEnter={() => handleDetailDragEnter(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDetailDrop(idx)}
                    className={`relative group flex items-center gap-2 rounded-sm border transition-all duration-100 overflow-visible
                      ${isDragging ? 'opacity-40 scale-[0.99]' : ''}
                      bg-white/5 border-sky-300/10 dark:bg-black/30 dark:border-white/5`}
                  >
                    {/* insertion line — above */}
                    {isOver && detailDrag !== null && detailDrag > idx && (
                      <div className="absolute -top-1 left-0 right-0 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.9)] z-10 pointer-events-none" />
                    )}

                    {/* drag handle */}
                    <div
                      draggable
                      onDragStart={(e) => handleDetailDragStart(e, idx)}
                      onDragEnd={handleDetailDragEnd}
                      className="pl-2 py-2.5 cursor-grab text-sky-300/20 group-hover:text-cyan-400/50 hover:text-cyan-400 transition-colors select-none shrink-0"
                    >
                      <GripVertical size={13} />
                    </div>

                    {/* bullet */}
                    <span className="text-cyan-400 dark:text-cyan-500 shrink-0 text-sm">›</span>

                    {/* editable text */}
                    <input
                      type="text"
                      value={pt}
                      onChange={(e) => handleEditDetail(idx, e.target.value)}
                      className="flex-1 bg-transparent py-2.5 text-xs font-mono text-sky-100 dark:text-gray-200 outline-none placeholder:text-sky-300/20 min-w-0"
                    />

                    {/* delete */}
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(idx)}
                      className="pr-2 py-2 text-sky-300/20 hover:text-red-400 dark:text-gray-700 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <X size={14} />
                    </button>

                    {/* insertion line — below */}
                    {isOver && detailDrag !== null && detailDrag < idx && (
                      <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.9)] z-10 pointer-events-none" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {editingExp.details.length === 0 && (
            <p className="text-[11px] font-mono text-sky-300/20 dark:text-gray-700 italic text-center py-3">
              No details yet. Add responsibilities or achievements above.
            </p>
          )}
        </div>
      </section>

    </div>
  );
}