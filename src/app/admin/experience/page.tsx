'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Briefcase, Terminal, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext'; 
import { useToast } from '@/context/ToastContext';
import { useThemeStore } from '@/lib/store/useThemeStore'; // 🌟 1. นำเข้าระบบตรวจสอบธีมกลาง

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
  
  const [originalSectorData, setOriginalSectorData] = useState(defaultSectorData);
  const [hasSectorChanges, setHasSectorChanges] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSector, setIsSavingSector] = useState(false);
  
  const { setUnsavedPath, isViewMode } = useAdmin();
  const { showToast } = useToast();
  const theme = useThemeStore((s) => s.theme); // 🌟 2. เรียกใช้งานสถานะธีม
  const isLight = theme === 'light';

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        const res = await fetch('/api/experience');
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            setSectorData(data.sectorData || defaultSectorData);
            setOriginalSectorData(data.sectorData || defaultSectorData);
            setExperiences(data.experiences || []);
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
    const isChanged = JSON.stringify(sectorData) !== JSON.stringify(originalSectorData);
    setHasSectorChanges(isChanged);
    setUnsavedPath('/admin/experience', isChanged);
  }, [sectorData, originalSectorData, setUnsavedPath]);

  const handleSaveSector = async () => {
    if (!hasSectorChanges) return;
    setIsSavingSector(true);
    try {
      await fetch('/api/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorData, experiences }) 
      });
      setOriginalSectorData(sectorData);
      showToast('Sector details synchronized! 🔵', 'success');
    } catch (error) {
      showToast('Transmission failed.', 'error');
    } finally {
      setIsSavingSector(false);
    }
  };

  const handleDeleteExperience = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); 
    if(!confirm('Are you sure you want to delete this temporal record?')) return;

    const newExperiences = experiences.filter(exp => (exp._id !== id && exp.id !== id));
    setExperiences(newExperiences);
    
    try {
      await fetch('/api/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorData, experiences: newExperiences })
      });
      showToast('Temporal record deleted successfully.', 'success');
    } catch (error) {
      showToast('Failed to delete record from database.', 'error');
    }
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-cyan-400 dark:text-cyan-500 font-mono tracking-widest animate-pulse">CALIBRATING CHRONO-RING...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sky-400/30 dark:border-cyan-500/30 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-sky-100 dark:text-white">Chrono-Ring Calibration</h1>
          <p className="text-xs text-cyan-400 dark:text-cyan-500 tracking-widest mt-2">[ MANAGE TIMELINE EXPERIENCE ]</p>
        </div>
        <Link href="/admin/experience/new">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#001320] font-bold text-xs tracking-widest rounded-sm transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <Plus size={16} /> NEW RECORD
          </button>
        </Link>
      </div>

      {/* SECTOR DETAILS PANEL */}
      <section className="p-6 rounded-sm space-y-4 backdrop-blur-md bg-white/5 border border-sky-300/20 dark:bg-cyan-950/10 dark:border-white/10">
        <div className="flex items-center justify-between border-b border-sky-300/20 dark:border-white/10 pb-3">
          <h2 className="text-lg font-serif text-white flex items-center gap-2">
            <Terminal size={18} className="text-cyan-400" /> Sector Details
          </h2>
          {!isViewMode && (
            <button
              onClick={handleSaveSector}
              disabled={isSavingSector || !hasSectorChanges}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-mono transition-all border ${
                hasSectorChanges
                  ? 'bg-cyan-500 border-cyan-400 text-[#001320] shadow-[0_0_10px_rgba(34,211,238,0.4)] cursor-pointer'
                  : 'bg-white/5 border-sky-300/20 dark:border-white/10 text-sky-200/40 cursor-not-allowed'
              }`}
            >
              {isSavingSector ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isSavingSector ? 'SAVING...' : hasSectorChanges ? 'SAVE SECTOR' : 'SECTOR UP TO DATE'}
            </button>
          )}
        </div>
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

      {/* TIMELINE EXPERIENCE CARDS */}
      <section className="space-y-4">
        <h3 className="font-mono text-xs text-sky-300/60 dark:text-gray-400 tracking-widest uppercase">Temporal Timeline Blocks ({experiences.length})</h3>
        
        {experiences.length === 0 ? (
          <div className="text-center py-10 rounded-sm text-sky-200/40 border border-dashed border-sky-300/20 dark:border-white/10 dark:text-gray-500 font-mono text-sm italic">
            NO TIMELINE LOGS DETECTED.
          </div>
        ) : (
          <div className="relative border-l pl-6 ml-3 space-y-6 border-sky-500/20 dark:border-cyan-500/20">
            {experiences.map((exp, index) => {
              const safeKey = `${exp._id || exp.id || 'exp'}-${index}`;
              const targetUrl = `/admin/experience/${exp._id || exp.id}`;

              return (
                <Link key={safeKey} href={targetUrl} className="block group">
                  <div className="border p-5 rounded-sm flex items-start justify-between gap-4 group-hover:border-cyan-400 cursor-pointer transition-all backdrop-blur-md relative bg-white/5 border-sky-300/20 dark:bg-black/40 dark:border-white/10 dark:group-hover:border-cyan-500/50">
                    <span className={`absolute -left-[31px] top-6 w-2 h-2 rounded-full group-hover:scale-125 transition-transform ${
                      isLight ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                    }`} />
                    
                    <div className="space-y-3 flex-1">
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

                    <button 
                      onClick={(e) => handleDeleteExperience(exp._id || exp.id!, e)}
                      className="p-2 border text-sky-200/30 border-sky-300/10 hover:text-red-400 hover:bg-red-500/5 rounded-sm opacity-0 group-hover:opacity-100 transition-all self-start dark:border-white/5 dark:text-gray-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}