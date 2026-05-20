'use client';

import { useState, useEffect } from 'react';
import { Save, Terminal, Code, Database, Layout, Wrench, X, Plus, Loader2, GripVertical } from 'lucide-react';
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

  const [skillDrag, setSkillDrag] = useState<{ skill: string; fromCat: keyof typeof formData.skills; fromIdx: number } | null>(null);
  const [skillDragOver, setSkillDragOver] = useState<{ toCat: keyof typeof formData.skills; toIdx: number | null } | null>(null);

  const { setUnsavedPath, isViewMode } = useAdmin();
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
    if (isViewMode) return;
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
    if (isViewMode) return;
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
    if (isViewMode) return;
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

  const handleSkillDragStart = (e: React.DragEvent, skill: string, fromCat: keyof typeof formData.skills, fromIdx: number) => {
    e.stopPropagation();
    setSkillDrag({ skill, fromCat, fromIdx });
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleSkillTagEnter = (e: React.DragEvent, toCat: keyof typeof formData.skills, toIdx: number) => {
    e.stopPropagation();
    setSkillDragOver({ toCat, toIdx });
  };
  const handleSkillCatEnter = (toCat: keyof typeof formData.skills) => {
    if (skillDrag) setSkillDragOver(prev => ({ toCat, toIdx: prev?.toCat === toCat ? prev.toIdx : null }));
  };
  const handleSkillDrop = (e: React.DragEvent, toCat: keyof typeof formData.skills) => {
    e.preventDefault();
    if (!skillDrag) return;
    const { skill, fromCat, fromIdx } = skillDrag;
    const toIdx = skillDragOver?.toCat === toCat ? skillDragOver.toIdx : null;
    setFormData(prev => {
      const cats = { ...prev.skills } as Record<string, string[]>;
      if (fromCat === toCat) {
        if (toIdx === null || toIdx === fromIdx) return prev;
        const arr = [...cats[fromCat]];
        const [moved] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, moved);
        cats[fromCat] = arr;
      } else {
        cats[fromCat] = cats[fromCat].filter((_, i) => i !== fromIdx);
        const toArr = [...cats[toCat]];
        toArr.splice(toIdx !== null ? toIdx : toArr.length, 0, skill);
        cats[toCat] = toArr;
      }
      return { ...prev, skills: cats as typeof prev.skills };
    });
    setSkillDrag(null);
    setSkillDragOver(null);
  };
  const handleSkillDragEnd = () => { setSkillDrag(null); setSkillDragOver(null); };

  // หน้าโหลดข้อมูล
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-emerald-400 dark:text-emerald-500 font-mono tracking-widest animate-pulse">LOADING ARSENAL DATA...</div>;
  }

  const categoryConfig = [
    { key: 'languages' as keyof typeof formData.skills, label: 'PROGRAMMING LANGUAGES', icon: <Code size={16} />, placeholder: 'e.g. Python, TypeScript...' },
    { key: 'database' as keyof typeof formData.skills, label: 'DATABASE & STORAGE', icon: <Database size={16} />, placeholder: 'e.g. MongoDB, PostgreSQL...' },
    { key: 'frameworks' as keyof typeof formData.skills, label: 'FRAMEWORKS & LIBRARIES', icon: <Layout size={16} />, placeholder: 'e.g. Next.js, React...' },
    { key: 'tools' as keyof typeof formData.skills, label: 'DEVOPS & TOOLS', icon: <Wrench size={16} />, placeholder: 'e.g. Git, Docker, Selenium...' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* STICKY TOPBAR */}
      <div className="sticky top-0 z-50 will-change-transform backdrop-blur-md -mx-6 md:-mx-10 px-6 md:px-10 pt-4 pb-4 border-b flex items-center justify-between bg-[#001320]/90 border-sky-400/30 dark:bg-gray-950/90 dark:border-emerald-500/30">
        <div>
          <h1 className="text-2xl font-serif text-sky-100 dark:text-white">Tech Forge Configuration</h1>
          <p className="text-[10px] text-emerald-400 tracking-widest mt-0.5">[ MANAGE SKILLS & ARSENAL ]</p>
        </div>
        {!isViewMode && (
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-2 px-5 py-2 font-bold text-xs tracking-widest rounded-sm transition-all border ${
              hasChanges
                ? 'bg-emerald-500 border-emerald-400 text-[#001320] shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer'
                : 'bg-white/5 border-sky-300/20 dark:border-white/10 text-sky-200/40 cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'SAVING...' : hasChanges ? 'SAVE ALL' : 'UP TO DATE'}
          </button>
        )}
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

        {/* ================= SECTION 1: SKILL CATEGORIES ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categoryConfig.map(({ key, label, icon, placeholder }) => {
            const isCatOver = skillDragOver?.toCat === key && skillDrag !== null && skillDrag.fromCat !== key;
            return (
              <section
                key={key}
                className={`border p-6 rounded-sm space-y-4 flex flex-col h-75 backdrop-blur-md bg-white/5 border-sky-300/20 dark:bg-black/40 dark:border-white/10 transition-all duration-150 ${
                  isCatOver ? 'ring-2 ring-emerald-400/60 bg-emerald-500/5' : ''
                }`}
                onDragEnter={() => handleSkillCatEnter(key)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleSkillDrop(e, key)}
              >
                <h2 className="text-sm font-mono text-emerald-400 flex items-center gap-2 border-b border-sky-300/20 dark:border-white/10 pb-3 shrink-0">
                  {icon} {label}
                  <span className="ml-auto text-[10px] text-sky-300/40 font-mono normal-case">drag to reorder or move</span>
                </h2>
                <div className="flex gap-2 shrink-0">
                  <input
                    type="text" value={inputs[key]}
                    onChange={(e) => setInputs(p => ({ ...p, [key]: e.target.value }))}
                    onKeyDown={(e) => handleKeyDown(e, key)}
                    placeholder={placeholder}
                    className="w-full bg-white/5 border border-sky-300/20 dark:border-white/10 p-2.5 rounded-sm text-sm text-sky-100 dark:text-white focus:border-emerald-400 outline-none transition-all font-mono"
                  />
                  <button type="button" onClick={() => handleAddSkill(key)} className="px-3 bg-white/5 border border-sky-300/20 text-emerald-400 hover:bg-emerald-500/20 rounded-sm dark:border-white/10"><Plus size={16} /></button>
                </div>
                <div className="flex flex-wrap gap-2 overflow-y-auto content-start flex-1 custom-scrollbar">
                  {formData.skills[key].map((skill, idx) => {
                    const isDraggingThis = skillDrag?.skill === skill && skillDrag?.fromCat === key && skillDrag?.fromIdx === idx;
                    const isTagOver = skillDragOver?.toCat === key && skillDragOver?.toIdx === idx && !isDraggingThis;
                    return (
                      <span
                        key={`${skill}-${idx}`}
                        draggable
                        onDragStart={(e) => handleSkillDragStart(e, skill, key, idx)}
                        onDragEnter={(e) => handleSkillTagEnter(e, key, idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnd={handleSkillDragEnd}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-400/30 dark:border-emerald-500/30 text-emerald-300 text-xs font-mono rounded-sm cursor-grab select-none transition-all duration-100 ${
                          isDraggingThis ? 'opacity-40 scale-95' : ''
                        } ${isTagOver ? 'ring-1 ring-emerald-400' : ''}`}
                      >
                        <GripVertical size={10} className="opacity-40 shrink-0" />
                        {skill}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveSkill(key, skill); }}
                          className="hover:text-red-400 transition-colors ml-0.5"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                  {formData.skills[key].length === 0 && !isCatOver && (
                    <p className="text-[11px] font-mono text-sky-200/20 dark:text-gray-700 italic">Drop a skill here to move it to this category</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </form>
    </div>
  );
}