'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Cpu, Terminal, Loader2, FolderGit2 } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/context/ToastContext';
import { useThemeStore } from '@/lib/store/useThemeStore'; // 🌟 1. นำเข้าระบบตรวจสอบธีม

export default function ServicesAdmin() {
  const defaultSectorData = {
    title: '[ ENERGY HUB ]',
    description: 'Specialized services engineered to bridge complex technical domains.',
  };

  const [sectorData, setSectorData] = useState(defaultSectorData);
  const [services, setServices] = useState<any[]>([]);
  
  const [originalSectorData, setOriginalSectorData] = useState(defaultSectorData);
  const [hasSectorChanges, setHasSectorChanges] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSector, setIsSavingSector] = useState(false);
  
  const { setUnsavedPath, isViewMode } = useAdmin();
  const { showToast } = useToast();
  const theme = useThemeStore((s) => s.theme); // 🌟 2. ดึงสถานะ Light/Dark
  const isLight = theme === 'light';

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            setSectorData(data.sectorData || defaultSectorData);
            setOriginalSectorData(data.sectorData || defaultSectorData);
            setServices(data.services || []);
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
    const isChanged = JSON.stringify(sectorData) !== JSON.stringify(originalSectorData);
    setHasSectorChanges(isChanged);
    setUnsavedPath('/admin/services', isChanged);
  }, [sectorData, originalSectorData, setUnsavedPath]);

  const handleSaveSector = async () => {
    if (!hasSectorChanges) return;
    setIsSavingSector(true);
    try {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorData, services })
      });
      setOriginalSectorData(sectorData);
      showToast('Sector details synchronized! 🟡', 'success');
    } catch (error) {
      showToast('Transmission failed.', 'error');
    } finally {
      setIsSavingSector(false);
    }
  };

  const handleDeleteService = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); 
    if(!confirm('Are you sure you want to delete this service stream?')) return;

    const newServices = services.filter(s => (s._id !== id && s.id !== id));
    setServices(newServices);
    
    try {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorData, services: newServices })
      });
      showToast('Service stream deleted successfully.', 'success');
    } catch (error) {
      showToast('Failed to delete service from database.', 'error');
    }
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-amber-400 dark:text-amber-500 font-mono tracking-widest animate-pulse">SYNCHRONIZING ENERGY HUB...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sky-400/30 dark:border-amber-500/30 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-sky-100 dark:text-white">Services Configuration</h1>
          <p className="text-xs text-amber-400 dark:text-amber-500 tracking-widest mt-2">[ MANAGE ENERGY HUB STREAMS ]</p>
        </div>
        <Link href="/admin/services/new">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#001320] font-bold text-xs tracking-widest rounded-sm transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            <Plus size={16} /> NEW SERVICE STREAM
          </button>
        </Link>
      </div>

      {/* SECTOR DETAILS PANEL */}
      <section className="p-6 rounded-sm space-y-4 backdrop-blur-md bg-white/5 border border-sky-300/20 dark:bg-amber-950/10 dark:border-white/10">
        <div className="flex items-center justify-between border-b border-sky-300/20 dark:border-white/10 pb-3">
          <h2 className="text-lg font-serif text-white flex items-center gap-2">
            <Terminal size={18} className="text-amber-400" /> Sector Details
          </h2>
          {!isViewMode && (
            <button
              onClick={handleSaveSector}
              disabled={isSavingSector || !hasSectorChanges}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-mono transition-all border ${
                hasSectorChanges
                  ? 'bg-amber-500 border-amber-400 text-[#001320] shadow-[0_0_10px_rgba(234,179,8,0.4)] cursor-pointer'
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
            <label className="text-xs text-sky-200/60 dark:text-amber-500 uppercase font-mono">Sector Title</label>
            <input type="text" value={sectorData.title} onChange={(e) => setSectorData(p => ({ ...p, title: e.target.value }))} className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-amber-500 outline-none transition-all font-mono" />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs text-sky-200/60 dark:text-amber-500 uppercase font-mono">Sector Description</label>
            <input type="text" value={sectorData.description} onChange={(e) => setSectorData(p => ({ ...p, description: e.target.value }))} className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-amber-500 outline-none transition-all" />
          </div>
        </div>
      </section>

      {/* DYNAMIC SERVICE CARDS */}
      <div className="grid grid-cols-1 gap-6">
        {services.length === 0 ? (
          <div className="col-span-full py-10 text-center text-sky-200/40 dark:text-gray-500 font-mono text-sm border border-dashed border-sky-300/20 dark:border-white/10">NO SERVICES ACTIVE. INITIALIZE ONE TO START.</div>
        ) : (
          services.map((svc, index) => {
            const safeKey = `${svc._id || svc.id || 'svc'}-${index}`;
            const targetUrl = `/admin/services/${svc._id || svc.id}`;

            return (
              <Link key={safeKey} href={targetUrl}>
                <div className="border p-5 rounded-sm flex items-start justify-between gap-4 group cursor-pointer transition-all backdrop-blur-md h-full bg-white/5 border-sky-300/20 hover:border-amber-400 dark:bg-black/40 dark:border-white/10 dark:hover:border-amber-500/50">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-amber-500/10 rounded-sm text-amber-400">
                        <Cpu size={16} />
                      </div>
                      <h4 className="text-md text-white font-serif">{svc.title}</h4>
                    </div>
                    
                    <div className="max-h-28 overflow-y-auto custom-scrollbar pr-2">
                      <p className={`text-xs leading-relaxed whitespace-pre-line break-words ${isLight ? 'text-sky-200/80' : 'text-gray-400'}`}>
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
                    onClick={(e) => {
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      handleDeleteService(svc._id || svc.id, e);
                    }} 
                    className="p-2 border border-sky-300/10 text-sky-200/30 hover:text-red-400 hover:bg-red-500/5 rounded-sm opacity-0 group-hover:opacity-100 transition-all shrink-0 dark:border-white/5 dark:text-gray-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}