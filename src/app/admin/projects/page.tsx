'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Terminal, Calendar, Loader2, Save } from 'lucide-react';
import Link from 'next/link'; 
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/context/ToastContext';
import { useThemeStore } from '@/lib/store/useThemeStore'; // 🌟 1. นำเข้าระบบตรวจสอบธีมกลาง

export default function ProjectsAdmin() {
  const defaultSectorData = { title: '[ CONSTELLATION ]', description: 'A stellar map of my complete projects.' };

  const [sectorData, setSectorData] = useState(defaultSectorData);
  const [originalSectorData, setOriginalSectorData] = useState(defaultSectorData);
  const [hasSectorChanges, setHasSectorChanges] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [tagsDict, setTagsDict] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSector, setIsSavingSector] = useState(false);
  
  const { setUnsavedPath } = useAdmin();
  const { showToast } = useToast();
  const theme = useThemeStore((s) => s.theme); // 🌟 2. ดึงสถานะ Light/Dark
  const isLight = theme === 'light';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const metaRes = await fetch('/api/projects/meta');
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          if (metaData?.sectorData) {
            setSectorData(metaData.sectorData);
            setOriginalSectorData(metaData.sectorData);
          }
        }
        
        const tagsRes = await fetch('/api/tags');
        if (tagsRes.ok) {
           const tagsList = await tagsRes.json();
           const dict: Record<string, string> = {};
           tagsList.forEach((t: any) => { dict[t._id] = t.name; });
           setTagsDict(dict);
        }

        const projRes = await fetch('/api/projects');
        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(projData);
        }
      } catch (error) {
        showToast('Failed to load constellation data', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  useEffect(() => {
    const isChanged = JSON.stringify(sectorData) !== JSON.stringify(originalSectorData);
    setHasSectorChanges(isChanged);
    setUnsavedPath('/admin/projects', isChanged);
  }, [sectorData, originalSectorData, setUnsavedPath]);

  const handleSaveSector = async () => {
    if (!hasSectorChanges) return;
    setIsSavingSector(true);
    try {
      await fetch('/api/projects/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorData })
      });
      setOriginalSectorData(sectorData);
      showToast('Sector details synchronized! 🪐', 'success');
    } catch (error) {
      showToast('Failed to save sector details.', 'error');
    } finally {
      setIsSavingSector(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    if(!confirm('Are you sure you want to delete this project?')) return;
    setProjects(prev => prev.filter(p => (p._id !== id && p.id !== id)));
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      showToast('Project deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete project', 'error');
    }
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-fuchsia-400 dark:text-fuchsia-500 font-mono tracking-widest animate-pulse">SCANNING CONSTELLATION...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sky-400/30 dark:border-fuchsia-500/30 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-sky-100 dark:text-white">Constellation Mapping</h1>
          <p className="text-xs text-fuchsia-400 dark:text-fuchsia-500 tracking-widest mt-2">[ MANAGE PROJECTS ]</p>
        </div>
        <Link href="/admin/projects/new">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-fuchsia-500 hover:bg-fuchsia-400 text-[#001320] font-bold text-xs tracking-widest rounded-sm transition-all shadow-[0_0_15px_rgba(217,70,239,0.3)]">
            <Plus size={16} /> NEW PROJECT
          </button>
        </Link>
      </div>

      {/* SECTOR DETAILS CONFIG */}
      <section className="p-6 rounded-sm space-y-4 backdrop-blur-md bg-white/5 border border-sky-300/20 dark:bg-black/40 dark:border-white/10">
        <div className="flex items-center justify-between border-b border-sky-300/20 dark:border-white/10 pb-3">
          <h2 className="text-lg font-serif text-white flex items-center gap-2">
            <Terminal size={18} className="text-fuchsia-400" /> Sector Details
          </h2>
          <button 
            onClick={handleSaveSector} 
            disabled={isSavingSector || !hasSectorChanges} 
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-mono transition-all border ${
              hasSectorChanges 
                ? 'bg-fuchsia-50 border-fuchsia-400 text-[#001320] shadow-[0_0_10px_rgba(217,70,239,0.4)] cursor-pointer' 
                : 'bg-white/5 border-sky-300/20 dark:border-white/10 text-sky-200/40 cursor-not-allowed'
            }`}
          >
            {isSavingSector ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
            {isSavingSector ? 'SAVING...' : hasSectorChanges ? 'SAVE SECTOR' : 'UP TO DATE'}
          </button>
        </div>
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

      {/* CARD GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
           <div className="col-span-full py-10 text-center text-sky-200/40 border border-dashed border-sky-300/20 dark:border-white/10 dark:text-gray-500 font-mono text-sm">NO PROJECTS FOUND. CREATE ONE TO START.</div>
        ) : (
          projects.map((proj, index) => {
            const targetId = proj._id || proj.id;
            const safeKey = `${targetId || 'proj'}-${index}`;

            return (
              <Link key={safeKey} href={`/admin/projects/${targetId}`}>
                <div className="group rounded-sm overflow-hidden cursor-pointer transition-all flex flex-col h-[320px] bg-white/5 border border-sky-300/20 hover:border-fuchsia-400 dark:bg-black/40 dark:border-white/10 dark:hover:border-fuchsia-500/50">
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
                        {proj.tags?.slice(0, 3).map((tagId: string) => {
                          const tagName = tagsDict[tagId] || tagId;
                          return (
                            <span key={tagId} className="text-[9px] font-mono px-2 py-0.5 border rounded-sm bg-fuchsia-500/5 border-fuchsia-400/30 text-fuchsia-300">
                              {tagName}
                            </span>
                          )
                        })}
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
            );
          })
        )}
      </div>
    </div>
  );
}