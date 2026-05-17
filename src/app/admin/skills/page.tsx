'use client';

import { useState, useEffect } from 'react';
import { Save, Terminal, Code, Database, Layout, Wrench, X, Plus, Loader2 } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/context/ToastContext'; 

export default function SkillsAdmin() {
  // 🌟 โครงสร้างข้อมูลเริ่มต้น
  const defaultData = {
    sectorData: { title: '[ TECH FORGE ]', description: 'Core technological competencies and automated testing arsenal.' },
    skills: {
      languages: [] as string[],
      database: [] as string[],
      frameworks: [] as string[],
      tools: [] as string[]
    }
  };

  const [formData, setFormData] = useState(defaultData);
  const [originalData, setOriginalData] = useState(defaultData);
  const [hasChanges, setHasChanges] = useState(false);

  // 🌟 State สำหรับช่องพิมพ์ Input ของแต่ละหมวด
  const [inputs, setInputs] = useState({
    languages: '',
    database: '',
    frameworks: '',
    tools: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const { setUnsavedPath } = useAdmin();
  const { showToast } = useToast(); 

  // 📡 โหลดข้อมูลจาก Database เมื่อเปิดหน้า
  useEffect(() => {
    const fetchSkillsData = async () => {
      try {
        const res = await fetch('/api/skills');
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            const mergedData = {
              sectorData: { ...defaultData.sectorData, ...(data.sectorData || {}) },
              skills: { ...defaultData.skills, ...(data.skills || {}) },
            };
            setFormData(mergedData);
            setOriginalData(mergedData); 
          }
        }
      } catch (error) {
        console.error('Failed to load Tech Forge data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSkillsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🌟 ระบบเซนเซอร์ตรวจจับความเปลี่ยนแปลง
  useEffect(() => {
    const isChanged = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(isChanged);
    setUnsavedPath('/admin/skills', isChanged); 
  }, [formData, originalData, setUnsavedPath]);

  // 💾 บันทึกข้อมูลลง Database
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save to database');
      
      setOriginalData(formData); 
      showToast('Tech Forge arsenal synchronized perfectly! 🟩', 'success'); 
    } catch (error) {
      showToast('System overload, failed to save data.', 'error'); 
    } finally {
      setIsSaving(false);
    }
  };

  // ================= ACTIONS: SKILL TAGS =================
  const handleAddSkill = (category: keyof typeof formData.skills) => {
    const value = inputs[category].trim();
    if (!value) return;
    if (formData.skills[category].includes(value)) {
      setInputs(prev => ({ ...prev, [category]: '' }));
      return; 
    }

    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: [...prev.skills[category], value]
      }
    }));
    setInputs(prev => ({ ...prev, [category]: '' })); 
  };

  const handleRemoveSkill = (category: keyof typeof formData.skills, skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].filter(s => s !== skillToRemove)
      }
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, category: keyof typeof formData.skills) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill(category);
    }
  };

  // หน้าโหลดข้อมูล
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-emerald-400 dark:text-emerald-500 font-mono tracking-widest animate-pulse">LOADING ARSENAL DATA...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sky-400/30 dark:border-emerald-500/30 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-sky-100 dark:text-white">Tech Forge Configuration</h1>
          <p className="text-xs text-emerald-400 dark:text-emerald-500 tracking-widest mt-2">[ MANAGE SKILLS & ARSENAL ]</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || !hasChanges} 
          className={`flex items-center gap-2 px-6 py-2.5 font-bold text-xs tracking-widest rounded-sm transition-all border shadow-[0_0_15px_rgba(16,185,129,0.2)] ${
            hasChanges 
              ? 'bg-emerald-500 border-emerald-400 text-[#001320] dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-black cursor-pointer' 
              : 'bg-white/5 text-sky-200/40 border-sky-300/20 dark:text-gray-500 dark:border-white/10 cursor-not-allowed'
          }`}
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'SYNCING...' : hasChanges ? 'SAVE CHANGES' : 'UP TO DATE'}
        </button>
      </div>

      <form className="space-y-8" onSubmit={handleSave}>
        
        {/* ================= SECTION 0: GLOBAL SECTOR CONFIG ================= */}
        <section className="p-6 rounded-sm space-y-4 backdrop-blur-md bg-white/5 border border-sky-300/20 dark:bg-emerald-950/10 dark:border-white/10">
          <h2 className="text-lg font-serif flex items-center gap-2 pb-3 text-emerald-400 dark:text-white border-b border-sky-300/20 dark:border-white/10">
            <Terminal size={18} className="text-emerald-400" /> Sector Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Sector Title</label>
              <input 
                type="text" 
                value={formData.sectorData.title}
                onChange={(e) => setFormData(p => ({...p, sectorData: {...p.sectorData, title: e.target.value}}))}
                className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-emerald-400 outline-none transition-all font-mono" 
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs text-sky-200/60 dark:text-gray-500 uppercase">Sector Description</label>
              <input 
                type="text" 
                value={formData.sectorData.description}
                onChange={(e) => setFormData(p => ({...p, sectorData: {...p.sectorData, description: e.target.value}}))}
                className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-3 rounded-sm text-sm text-sky-100 dark:text-white focus:border-emerald-400 outline-none transition-all" 
              />
            </div>
          </div>
        </section>

        {/* ================= SECTION 1: SKILL ARRAYS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* --- 1. PROGRAMMING LANGUAGES --- */}
          <section className="border p-6 rounded-sm space-y-4 flex flex-col h-[300px] backdrop-blur-md bg-white/5 border-sky-300/20 dark:bg-black/40 dark:border-white/10">
            <h2 className="text-sm font-mono text-emerald-400 flex items-center gap-2 border-b border-sky-300/20 dark:border-white/10 pb-3">
              <Code size={16} /> PROGRAMMING LANGUAGES
            </h2>
            <div className="flex gap-2">
              <input 
                type="text" value={inputs.languages}
                onChange={(e) => setInputs(p => ({ ...p, languages: e.target.value }))}
                onKeyDown={(e) => handleKeyDown(e, 'languages')}
                placeholder="e.g. Python, TypeScript..."
                className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-2.5 rounded-sm text-sm text-sky-100 dark:text-white focus:border-emerald-400 outline-none transition-all font-mono" 
              />
              <button type="button" onClick={() => handleAddSkill('languages')} className="px-3 bg-white/5 border border-sky-300/20 text-emerald-400 hover:bg-emerald-500/20 rounded-sm dark:border-white/10"><Plus size={16}/></button>
            </div>
            <div className="flex flex-wrap gap-2 overflow-y-auto content-start flex-1 pt-2 custom-scrollbar">
              {formData.skills.languages.map(skill => (
                <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-400/30 dark:border-emerald-500/30 text-emerald-300 text-xs font-mono rounded-sm">
                  {skill} <button type="button" onClick={() => handleRemoveSkill('languages', skill)} className="hover:text-red-400 transition-colors"><X size={12} /></button>
                </span>
              ))}
            </div>
          </section>

          {/* --- 2. DATABASE --- */}
          <section className="border p-6 rounded-sm space-y-4 flex flex-col h-[300px] backdrop-blur-md bg-white/5 border-sky-300/20 dark:bg-black/40 dark:border-white/10">
            <h2 className="text-sm font-mono text-emerald-400 flex items-center gap-2 border-b border-sky-300/20 dark:border-white/10 pb-3">
              <Database size={16} /> DATABASE & STORAGE
            </h2>
            <div className="flex gap-2">
              <input 
                type="text" value={inputs.database}
                onChange={(e) => setInputs(p => ({ ...p, database: e.target.value }))}
                onKeyDown={(e) => handleKeyDown(e, 'database')}
                placeholder="e.g. MongoDB, PostgreSQL..."
                className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-2.5 rounded-sm text-sm text-sky-100 dark:text-white focus:border-emerald-400 outline-none transition-all font-mono" 
              />
              <button type="button" onClick={() => handleAddSkill('database')} className="px-3 bg-white/5 border border-sky-300/20 text-emerald-400 hover:bg-emerald-500/20 rounded-sm dark:border-white/10"><Plus size={16}/></button>
            </div>
            <div className="flex flex-wrap gap-2 overflow-y-auto content-start flex-1 pt-2 custom-scrollbar">
              {formData.skills.database.map(skill => (
                <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-400/30 dark:border-emerald-500/30 text-emerald-300 text-xs font-mono rounded-sm">
                  {skill} <button type="button" onClick={() => handleRemoveSkill('database', skill)} className="hover:text-red-400 transition-colors"><X size={12} /></button>
                </span>
              ))}
            </div>
          </section>

          {/* --- 3. FRAMEWORKS --- */}
          <section className="border p-6 rounded-sm space-y-4 flex flex-col h-[300px] backdrop-blur-md bg-white/5 border-sky-300/20 dark:bg-black/40 dark:border-white/10">
            <h2 className="text-sm font-mono text-emerald-400 flex items-center gap-2 border-b border-sky-300/20 dark:border-white/10 pb-3">
              <Layout size={16} /> FRAMEWORKS & LIBRARIES
            </h2>
            <div className="flex gap-2">
              <input 
                type="text" value={inputs.frameworks}
                onChange={(e) => setInputs(p => ({ ...p, frameworks: e.target.value }))}
                onKeyDown={(e) => handleKeyDown(e, 'frameworks')}
                placeholder="e.g. Next.js, React, Robot Framework..."
                className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-2.5 rounded-sm text-sm text-sky-100 dark:text-white focus:border-emerald-400 outline-none transition-all font-mono" 
              />
              <button type="button" onClick={() => handleAddSkill('frameworks')} className="px-3 bg-white/5 border border-sky-300/20 text-emerald-400 hover:bg-emerald-500/20 rounded-sm dark:border-white/10"><Plus size={16}/></button>
            </div>
            <div className="flex flex-wrap gap-2 overflow-y-auto content-start flex-1 pt-2 custom-scrollbar">
              {formData.skills.frameworks.map(skill => (
                <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-400/30 dark:border-emerald-500/30 text-emerald-300 text-xs font-mono rounded-sm">
                  {skill} <button type="button" onClick={() => handleRemoveSkill('frameworks', skill)} className="hover:text-red-400 transition-colors"><X size={12} /></button>
                </span>
              ))}
            </div>
          </section>

          {/* --- 4. TOOLS --- */}
          <section className="border p-6 rounded-sm space-y-4 flex flex-col h-[300px] backdrop-blur-md bg-white/5 border-sky-300/20 dark:bg-black/40 dark:border-white/10">
            <h2 className="text-sm font-mono text-emerald-400 flex items-center gap-2 border-b border-sky-300/20 dark:border-white/10 pb-3">
              <Wrench size={16} /> DEVOPS & TOOLS
            </h2>
            <div className="flex gap-2">
              <input 
                type="text" value={inputs.tools}
                onChange={(e) => setInputs(p => ({ ...p, tools: e.target.value }))}
                onKeyDown={(e) => handleKeyDown(e, 'tools')}
                placeholder="e.g. Git, Docker, Selenium..."
                className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-2.5 rounded-sm text-sm text-sky-100 dark:text-white focus:border-emerald-400 outline-none transition-all font-mono" 
              />
              <button type="button" onClick={() => handleAddSkill('tools')} className="px-3 bg-white/5 border border-sky-300/20 text-emerald-400 hover:bg-emerald-500/20 rounded-sm dark:border-white/10"><Plus size={16}/></button>
            </div>
            <div className="flex flex-wrap gap-2 overflow-y-auto content-start flex-1 pt-2 custom-scrollbar">
              {formData.skills.tools.map(skill => (
                <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-400/30 dark:border-emerald-500/30 text-emerald-300 text-xs font-mono rounded-sm">
                  {skill} <button type="button" onClick={() => handleRemoveSkill('tools', skill)} className="hover:text-red-400 transition-colors"><X size={12} /></button>
                </span>
              ))}
            </div>
          </section>

        </div>
      </form>
    </div>
  );
}