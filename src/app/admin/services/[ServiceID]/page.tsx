'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, ArrowLeft, CheckSquare, Square, FolderGit2, Loader2 } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/context/ToastContext';
import { useThemeStore } from '@/lib/store/useThemeStore'; // 🌟 1. นำเข้าระบบตรวจสอบธีม

interface ServiceItem {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  linkedProjectIds: string[];
}

interface AvailableProject {
  id: string;
  name: string;
  codename: string;
}

export default function SingleServicePage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.ServiceID as string; 

  const [fullData, setFullData] = useState<{ sectorData: any, services: ServiceItem[] } | null>(null);
  const [availableProjects, setAvailableProjects] = useState<AvailableProject[]>([]);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [originalService, setOriginalService] = useState<ServiceItem | null>(null);
  
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const { setUnsavedPath, isViewMode } = useAdmin();
  const { showToast } = useToast();
  const theme = useThemeStore((s) => s.theme); // 🌟 2. ดึงสถานะ Light/Dark
  const isLight = theme === 'light';

  useEffect(() => {
    const fetchCoreMetrics = async () => {
      try {
        const projectsRes = await fetch('/api/projects');
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setAvailableProjects(projectsData.map((p: any) => ({ id: p._id, name: p.title, codename: p.time || 'N/A' })));
        }

        const servicesRes = await fetch('/api/services');
        if (servicesRes.ok) {
          const data = await servicesRes.json();
          setFullData(data); 
          
          if (serviceId === 'new') {
            const newSvc: ServiceItem = { id: Date.now().toString(), title: '', description: '', linkedProjectIds: [] };
            setEditingService(newSvc);
            setOriginalService(newSvc);
          } else {
            const target = data.services?.find((s: any) => s._id === serviceId || s.id === serviceId);
            if (target) {
              setEditingService(target);
              setOriginalService(target);
            } else {
              showToast('Service stream not found.', 'error');
              router.push('/admin/services');
            }
          }
        }
      } catch (error) {
        showToast('Connection failed.', 'error');
        router.push('/admin/services');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoreMetrics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, router]);

  useEffect(() => {
    if (!editingService || !originalService) return;
    const isChanged = JSON.stringify(editingService) !== JSON.stringify(originalService);
    setHasChanges(isChanged);
    setUnsavedPath('/admin/services', isChanged); 
  }, [editingService, originalService, setUnsavedPath]);

  const handleToggleProject = (projectId: string) => {
    if (!editingService) return;
    setEditingService((prev) => {
      if (!prev) return prev;
      const isSelected = prev.linkedProjectIds.includes(projectId);
      return {
        ...prev,
        linkedProjectIds: isSelected 
          ? prev.linkedProjectIds.filter(id => id !== projectId)
          : [...prev.linkedProjectIds, projectId]
      };
    });
  };

  const handleSaveService = async () => {
    if (!editingService || !hasChanges || !fullData) return;
    setIsSaving(true);
    
    try {
      let newServicesList = [...(fullData.services || [])];
      const existingIndex = newServicesList.findIndex(s => s._id === editingService._id || s.id === editingService.id);
      
      if (existingIndex >= 0) {
        newServicesList[existingIndex] = editingService; 
      } else {
        newServicesList.push(editingService); 
      }

      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorData: fullData.sectorData, services: newServicesList }),
      });

      if (!res.ok) throw new Error('Failed to save service');
      
      setUnsavedPath('/admin/services', false);
      showToast('Service stream synchronized! 🟡', 'success');
      router.push('/admin/services');
    } catch (error) {
      showToast('Transmission failed.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToList = () => {
    if (hasChanges && !confirm('You have unsaved changes. Leave?')) return;
    setUnsavedPath('/admin/services', false);
    router.push('/admin/services');
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-amber-400 font-mono tracking-widest animate-pulse">MOUNTING CONFIGURATION PANEL...</div>;
  }

  if (!editingService) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32 animate-in fade-in duration-300">
      
      {/* STICKY HEADER CONTROLS */}
      {/* 🌟 [FIXED] เปลี่ยนสีพื้นหลังแถบสติ๊กกี้โหมดสว่างให้เนียนเข้ากับสีอวกาศห้วงลึก #001320 */}
      <div className="sticky top-0 z-10 backdrop-blur-md pt-4 pb-4 border-b flex items-center justify-between bg-[#001320]/90 border-sky-400/30 dark:bg-gray-950/90 dark:border-amber-500/30">
        <button onClick={handleBackToList} className="flex items-center gap-2 text-sky-200/50 hover:text-amber-500 transition-colors text-xs font-mono tracking-widest dark:text-gray-400">
          <ArrowLeft size={16} /> BACK TO ORBIT
        </button>
        {!isViewMode && (
          <button
            onClick={handleSaveService}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-2 px-6 py-2 font-bold text-xs tracking-widest rounded-sm transition-all border ${
              hasChanges
                ? 'bg-amber-500 border-amber-400 text-[#001320] shadow-[0_0_15px_rgba(234,179,8,0.3)] cursor-pointer'
                : 'bg-white/5 border-sky-300/20 text-sky-200/40 dark:border-white/10 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'SAVING...' : hasChanges ? 'COMMIT STREAM' : 'UP TO DATE'}
          </button>
        )}
      </div>

      {/* CORE FORM CONFIG */}
      <section className="border p-6 rounded-sm space-y-6 backdrop-blur-md bg-white/5 border-sky-300/20 dark:bg-black/40 dark:border-white/10">
        <div className="space-y-1">
          <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Service Title</label>
          <input 
            type="text" placeholder="e.g. Automated Regression Testing Suite"
            value={editingService.title}
            onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
            className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-amber-500 outline-none transition-all" 
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Service Description</label>
          <textarea 
            rows={4} placeholder="Detail the capabilities..."
            value={editingService.description}
            onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
            className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-amber-500 outline-none transition-all resize-none" 
          />
        </div>

        {/* MULTI-SELECT PROJECTS CHECKLIST */}
        <div className="space-y-3 border-t border-sky-300/20 dark:border-white/5 pt-4">
          <label className="text-xs tracking-wider flex items-center gap-2 font-mono text-sky-200/60 dark:text-gray-400">
            <FolderGit2 size={14} className="text-amber-400" />
            LINK PROJECT CLUSTERS (เชื่อมโยงโปรเจกต์)
          </label>
          
          {availableProjects.length === 0 ? (
            <div className="text-xs font-mono italic p-3 border border-dashed text-sky-200/30 border-sky-300/20 dark:text-gray-600 dark:border-white/5">
              NO PROJECTS DISCOVERED. PLEASE DEPLOY PROJECTS FIRST.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableProjects.map((project) => {
                const isChecked = editingService.linkedProjectIds.includes(project.id);
                return (
                  <div 
                    key={project.id} onClick={() => handleToggleProject(project.id)}
                    className={`p-3 border rounded-sm flex items-center justify-between cursor-pointer transition-all backdrop-blur-sm ${
                      isChecked 
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(234,179,8,0.15)]' 
                        : 'bg-white/5 border-sky-300/20 text-sky-200/50 hover:border-sky-300 dark:bg-black/20 dark:border-white/10 dark:text-gray-400 dark:hover:border-white/30 dark:hover:text-gray-300'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold font-serif text-white">{project.name}</span>
                      <span className={`text-[10px] font-mono mt-0.5 ${isChecked ? 'text-amber-400/80' : 'text-sky-300/40 dark:text-gray-500'}`}>[{project.codename}]</span>
                    </div>
                    {isChecked ? <CheckSquare size={16} className="text-amber-400" /> : <Square size={16} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}