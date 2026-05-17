'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import { useThemeStore } from '@/lib/store/useThemeStore';
import { 
  X, Download, Calendar, Cpu, Code, Database, Layout, 
  Wrench, Briefcase, ChevronRight, ChevronLeft, Activity, ShieldCheck, FolderGit2
} from 'lucide-react'; // 🌟 นำเข้า Icon ลูกศรและ Dashboard เพิ่มเติม

const profileImages = [
  '/textures/me.png',
  '/textures/me2.png',
  '/textures/me3.png',
];

export default function DataSlate() {
  const isSummaryMode = useAppStore((state) => state.isSummaryMode);
  const toggleSummaryMode = useAppStore((state) => state.toggleSummaryMode);
  const setSummaryMode = useAppStore((state) => state.setSummaryMode);
  const setSystemBooted = useAppStore((state) => state.setSystemBooted);
  const theme = useThemeStore((s) => s.theme); 
  const isLight = theme === 'light';

  const pathname = usePathname();
  const router = useRouter();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // 🌟 [NEW] State สำหรับควบคุมการเปิดหน้า 1 / หน้า 2 ภายในหมวด Identity
  const [aboutPage, setAboutPage] = useState<1 | 2>(1);

  // States สำหรับจัดเก็บข้อมูลจริงจาก MongoDB
  const [projects, setProjects] = useState<any[]>([]);
  const [tagsDict, setTagsDict] = useState<Record<string, string>>({});
  const [servicesData, setServicesData] = useState<any>({ sectorData: {}, services: [] });
  const [experienceData, setExperienceData] = useState<any>({ sectorData: {}, experiences: [] });
  const [skillsData, setSkillsData] = useState<any>({ sectorData: {}, skills: { languages: [], database: [], frameworks: [], tools: [] } });

  // 🌟 รีเซ็ตหน้ากลับไปหน้าที่ 1 เสมอเมื่อเปลี่ยนหมวดหมู่
  useEffect(() => {
    setAboutPage(1);
  }, [pathname, isSummaryMode]);

  useEffect(() => {
    if (pathname !== '/' && !pathname.startsWith('/admin')) {
      setSystemBooted(true);
      setSummaryMode(true);
    }
  }, [pathname, setSystemBooted, setSummaryMode]);

  const handleClose = () => {
    if (pathname !== '/') {
      setSummaryMode(false);
    } else {
      toggleSummaryMode();
    }
  }; 

  useEffect(() => {
    if (!isSummaryMode) return;

    const fetchAllTelemetry = async () => {
      try {
        const tagsRes = await fetch('/api/tags');
        if (tagsRes.ok) {
          const tagsList = await tagsRes.json();
          const dict: Record<string, string> = {};
          tagsList.forEach((t: any) => { dict[t._id] = t.name; });
          setTagsDict(dict);
        }

        const projRes = await fetch('/api/projects');
        if (projRes.ok) setProjects(await projRes.json());

        const servicesRes = await fetch('/api/services');
        if (servicesRes.ok) setServicesData(await servicesRes.json());

        const expRes = await fetch('/api/experience');
        if (expRes.ok) setExperienceData(await expRes.json());

        const skillsRes = await fetch('/api/skills');
        if (skillsRes.ok) setSkillsData(await skillsRes.json());

      } catch (error) {
        console.error('[ TELEMETRY FETCH FAILED ]', error);
      }
    };

    fetchAllTelemetry();
  }, [isSummaryMode]);

  useEffect(() => {
    if (!isSummaryMode || (pathname !== '/' && pathname !== '/about')) return;
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % profileImages.length);
    }, 3000);
    return () => clearInterval(intervalId);
  }, [isSummaryMode, pathname]);

  // ========================================================
  // 🛠️ RENDER 1: PROFILE (รองรับระบบ 2 หน้า)
  // ========================================================
  const renderProfile = () => {
    // 🌟 คำนวณสถิติสดๆ จาก State ที่มีอยู่แล้ว (ไม่ต้องยิง API ใหม่)
    const totalSkills = Object.values(skillsData?.skills || {}).reduce((acc: number, arr: any) => acc + (arr?.length || 0), 0) as number;
    const totalProjects = projects.length || 0;
    const totalServices = servicesData?.services?.length || 0;
    const totalExperiences = experienceData?.experiences?.length || 0;

    return (
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          {aboutPage === 1 ? (
            // 🌟 PAGE 1: ข้อมูลส่วนตัว (Identity)
            <motion.div 
              key="page1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col lg:flex-row gap-10"
            >
              <div className="w-full lg:w-1/3 flex flex-col gap-6">
                <div className={`relative w-full aspect-square md:aspect-[4/5] rounded-sm overflow-hidden group border ${
                  isLight ? 'bg-white/5 border-sky-300/30' : 'bg-black/60 border-cyan-500/20'
                }`}>
                  <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 z-10 ${isLight ? 'border-sky-400' : 'border-cyan-400'}`} />
                  <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 z-10 ${isLight ? 'border-sky-400' : 'border-cyan-400'}`} />
                  <AnimatePresence mode="popLayout">
                    <motion.img
                      key={currentImageIndex}
                      src={profileImages[currentImageIndex]}
                      alt="Profile"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.85 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 w-full h-full object-cover group-hover:opacity-100 transition-opacity"
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-0" />
                </div>
                <div>
                  <h1 className="text-3xl font-serif text-white tracking-wider mb-1">Monthol Sukjinda</h1>
                  <p className={`font-mono text-sm animate-pulse ${isLight ? 'text-sky-300' : 'text-cyan-400'}`}>
                    [ AUTOMATION TESTER & DEVELOPER ]
                  </p>
                </div>
                <button className={`w-full flex items-center justify-center gap-3 px-6 py-4 border font-mono font-bold text-xs tracking-widest transition-all ${
                  isLight 
                    ? 'bg-sky-500/10 border-sky-400 text-sky-300 hover:bg-sky-500 hover:text-white' 
                    : 'bg-cyan-500/10 border-cyan-500 text-cyan-400 hover:bg-cyan-400 hover:text-black'
                }`}>
                  <Download size={18} /> [ DOWNLOAD CV ]
                </button>
              </div>

              <div className="w-full lg:w-2/3 flex flex-col justify-between space-y-8">
                <div className="space-y-8">
                  <div className={`relative p-6 rounded-sm border ${
                    isLight ? 'bg-white/5 border-sky-300/20' : 'bg-cyan-950/10 border-cyan-500/20'
                  }`}>
                    <p className={`text-sm leading-relaxed ${isLight ? 'text-sky-100' : 'text-gray-300'}`}>
                      Hi, I'm Monthol. A developer and automation tester proficient in building reliable automation arsenals, handling databases, and architecting seamless digital workflows.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-sm border ${isLight ? 'bg-white/5 border-sky-300/20' : 'bg-white/5 border-white/5'}`}>
                      <p className={`text-[10px] font-mono ${isLight ? 'text-sky-400/70' : 'text-gray-500'}`}>STUDENT ID</p>
                      <p className="text-sm text-white font-mono">65090500452</p>
                    </div>
                    <div className={`p-4 rounded-sm border ${isLight ? 'bg-white/5 border-sky-300/20' : 'bg-white/5 border-white/5'}`}>
                      <p className={`text-[10px] font-mono ${isLight ? 'text-sky-400/70' : 'text-gray-500'}`}>BASE LOCATION</p>
                      <p className="text-sm text-white">Bangkok, Thailand</p>
                    </div>
                  </div>
                </div>

                {/* 🌟 ปุ่มนำทางไปหน้า Dashboard */}
                <div className="flex justify-end pt-6">
                  <button 
                    onClick={() => setAboutPage(2)}
                    className={`group flex items-center gap-2 px-5 py-2.5 rounded-sm font-mono text-xs tracking-widest border transition-all ${
                      isLight 
                        ? 'bg-sky-500/10 border-sky-400 text-sky-300 hover:bg-sky-500 hover:text-[#001320]' 
                        : 'bg-cyan-500/10 border-cyan-500 text-cyan-400 hover:bg-cyan-400 hover:text-black'
                    }`}
                  >
                    SYSTEM TELEMETRY <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>

          ) : (
            // 🌟 PAGE 2: Dashboard System Telemetry (ข้อมูลแบบเดียวกับหน้าหลังบ้าน)
            <motion.div 
              key="page2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col h-full space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 border-sky-400/30 dark:border-cyan-500/30">
                <div>
                  <h1 className="text-3xl font-serif text-white flex items-center gap-3" style={{ color: '#ffffff' }}>
                    <Activity className={`animate-pulse ${isLight ? 'text-sky-400' : 'text-cyan-400'}`} size={28} />
                    Command Telemetry
                  </h1>
                  <p className={`text-xs tracking-widest mt-2 ${isLight ? 'text-sky-400' : 'text-cyan-500'}`}>[ SYSTEM ROOT MONITORING PLATFORM ]</p>
                </div>
                <div className={`flex items-center gap-2.5 px-4 py-2 border rounded-sm font-mono text-xs ${
                  isLight ? 'bg-white/5 border-sky-300/20 text-sky-300' : 'bg-white/5 border-cyan-500/20 text-cyan-400'
                }`}>
                  <ShieldCheck size={14} className="text-emerald-400 animate-bounce" />
                  <span>SECURITY: ACTIVE</span>
                </div>
              </div>

              {/* 🌟 METRICS GRID */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 content-start">
                {[
                  { label: 'PROJECTS', val: totalProjects, icon: FolderGit2, clr: isLight ? 'text-fuchsia-400' : 'text-rose-400' },
                  { label: 'SKILL NODES', val: totalSkills, icon: Code, clr: 'text-emerald-400' },
                  { label: 'SERVICES', val: totalServices, icon: Cpu, clr: 'text-amber-400' },
                  { label: 'RECORDS', val: totalExperiences, icon: Briefcase, clr: isLight ? 'text-sky-400' : 'text-cyan-400' },
                ].map((m, idx) => (
                  <div key={idx} className={`p-5 border rounded-sm flex flex-col items-start justify-between group transition-colors ${
                    isLight ? 'bg-white/5 border-sky-300/20 hover:border-sky-400' : 'bg-black/40 border-white/10 hover:border-cyan-500'
                  }`}>
                    <div className="space-y-1 w-full flex justify-between items-start">
                      <p className={`text-[9px] font-mono tracking-widest uppercase ${isLight ? 'text-sky-200/60' : 'text-gray-500'}`}>{m.label}</p>
                      <m.icon size={16} className={`${m.clr} opacity-60 group-hover:opacity-100 transition-opacity`} />
                    </div>
                    <p className={`text-3xl font-mono font-bold mt-4 ${m.clr}`}>{m.val}</p>
                  </div>
                ))}
              </div>

              {/* 🌟 ปุ่มย้อนกลับ */}
              <div className="flex justify-start pt-6 mt-auto">
                <button 
                  onClick={() => setAboutPage(1)}
                  className={`group flex items-center gap-2 px-5 py-2.5 rounded-sm font-mono text-xs tracking-widest border transition-all ${
                    isLight 
                      ? 'bg-sky-500/10 border-sky-400 text-sky-300 hover:bg-sky-500 hover:text-[#001320]' 
                      : 'bg-cyan-500/10 border-cyan-500 text-cyan-400 hover:bg-cyan-400 hover:text-black'
                  }`}
                >
                  <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> BACK TO IDENTITY
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ========================================================
  // 🛠️ RENDER 2: SKILLS
  // ========================================================
  const renderSkills = () => {
    const coreSkills = skillsData?.skills || {};
    const skillCategories = [
      { name: 'PROGRAMMING LANGUAGES', items: coreSkills.languages || [], icon: <Code size={16} /> },
      { name: 'DATABASE & STORAGE', items: coreSkills.database || [], icon: <Database size={16} /> },
      { name: 'FRAMEWORKS & LIBRARIES', items: coreSkills.frameworks || [], icon: <Layout size={16} /> },
      { name: 'DEVOPS & TOOLS', items: coreSkills.tools || [], icon: <Wrench size={16} /> },
    ];

    return (
      <div className="space-y-8">
        <div className={`border-b pb-4 ${isLight ? 'border-sky-300/20' : 'border-cyan-500/30'}`}>
          <h1 className="text-3xl font-serif mb-2" style={{ color: '#ffffff' }}>{skillsData?.sectorData?.title || '[ TECH FORGE ]'}</h1>
          <p className={`font-mono text-sm ${isLight ? 'text-sky-300' : 'text-cyan-400'}`}>{skillsData?.sectorData?.description || 'Competencies registry.'}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skillCategories.map((cat, idx) => (
            <div key={idx} className={`border p-5 rounded-sm space-y-4 ${isLight ? 'bg-white/5 border-sky-300/20' : 'bg-black/20 border-white/10'}`}>
              <h3 className={`font-mono tracking-widest text-xs flex items-center gap-2 uppercase ${isLight ? 'text-sky-300' : 'text-cyan-400'}`}>
                {cat.icon} {cat.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {cat.items.length === 0 ? (
                  <span className="text-xs text-gray-600 font-mono italic">No node records deployed.</span>
                ) : (
                  cat.items.map((item: string, i: number) => (
                    <span key={i} className={`px-3 py-1 border text-xs font-mono rounded-sm ${
                      isLight ? 'bg-sky-500/5 border-sky-400/30 text-sky-200' : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-300'
                    }`}>
                      {item}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ========================================================
  // 🛠️ RENDER 3: SERVICES
  // ========================================================
  const renderServices = () => (
    <div className="space-y-8">
      <div className={`border-b pb-4 ${isLight ? 'border-sky-300/20' : 'border-cyan-500/30'}`}>
        <h1 className="text-3xl font-serif mb-2" style={{ color: '#ffffff' }}>{servicesData?.sectorData?.title || '[ ENERGY HUB ]'}</h1>
        <p className={`font-mono text-sm ${isLight ? 'text-sky-300' : 'text-cyan-400'}`}>{servicesData?.sectorData?.description || 'Service streams.'}</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {(servicesData?.services || []).map((svc: any, index: number) => (
          <div key={index} className={`border p-6 rounded-sm space-y-3 ${isLight ? 'bg-white/5 border-sky-300/20' : 'bg-black/30 border-white/10'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-sm ${isLight ? 'bg-sky-500/10 text-sky-300' : 'bg-cyan-500/10 text-cyan-400'}`}><Cpu size={16} /></div>
              <h3 className="font-serif text-white text-lg">{svc.title}</h3>
            </div>
            <p className={`text-xs leading-relaxed whitespace-pre-line break-words max-h-24 overflow-y-auto custom-scrollbar pr-2 ${isLight ? 'text-sky-200/80' : 'text-gray-400'}`}>{svc.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // ========================================================
  // 🛠️ RENDER 4: EXPERIENCE
  // ========================================================
  const renderExperience = () => (
    <div className="space-y-8">
      <div className={`border-b pb-4 ${isLight ? 'border-sky-300/20' : 'border-cyan-500/30'}`}>
        <h1 className="text-3xl font-serif mb-2" style={{ color: '#ffffff' }}>{experienceData?.sectorData?.title || '[ CHRONO-RING ]'}</h1>
        <p className={`font-mono text-sm ${isLight ? 'text-sky-300' : 'text-cyan-400'}`}>{experienceData?.sectorData?.description || 'Timeline logs.'}</p>
      </div>
      <div className={`relative border-l ml-3 space-y-6 ${isLight ? 'border-sky-500/20' : 'border-cyan-500/20'}`}>
        {(experienceData?.experiences || []).map((exp: any, index: number) => (
          <div key={index} className={`relative border p-5 rounded-sm ml-6 ${isLight ? 'bg-white/5 border-sky-300/20' : 'bg-black/20 border-white/5'}`}>
            <span className={`absolute -left-[31px] top-6 w-2 h-2 rounded-full ${
              isLight ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
            }`} />
            <div className="flex flex-wrap items-baseline justify-between gap-4 mb-2">
              <h4 className="text-lg text-white font-serif flex items-center gap-2">
                <Briefcase size={16} className={isLight ? 'text-sky-300' : 'text-cyan-400'} /> {exp.title}
              </h4>
              <span className={`font-mono text-[10px] border px-2 py-0.5 rounded-sm ${
                isLight ? 'bg-sky-500/10 border-sky-400/30 text-sky-300' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}>{exp.time}</span>
            </div>
            <ul className="space-y-1.5">
              {exp.details?.map((detail: string, i: number) => (
                <li key={i} className={`flex gap-2 text-xs font-mono ${isLight ? 'text-sky-200/80' : 'text-gray-400'}`}>
                  <span className={isLight ? 'text-sky-400' : 'text-cyan-500'}>›</span><span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  // ========================================================
  // 🛠️ RENDER 5: PROJECTS
  // ========================================================
  const renderProjects = () => (
    <div className="space-y-8">
      <div className={`border-b pb-4 ${isLight ? 'border-sky-300/20' : 'border-cyan-500/30'}`}>
        <h1 className="text-3xl font-serif mb-2" style={{ color: '#ffffff' }}>[ CONSTELLATION ]</h1>
        <p className={`font-mono text-sm ${isLight ? 'text-sky-300' : 'text-cyan-400'}`}>Stellar deployment logs and automated testing case studies.</p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {projects.map((proj, index) => (
          <div key={index} className={`border p-6 rounded-sm space-y-4 ${isLight ? 'bg-white/5 border-sky-300/20' : 'bg-black/30 border-white/10'}`}>
            <div className="flex justify-between items-start flex-wrap gap-4 border-b border-white/5 pb-3">
              <div>
                <h3 className="font-serif text-white text-xl">{proj.title}</h3>
                <p className={`font-mono text-[10px] mt-1 flex items-center gap-1.5 ${isLight ? 'text-sky-300' : 'text-cyan-400'}`}>
                  <Calendar size={12} /> {proj.time}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {proj.tags?.map((tagId: string) => (
                  <span key={tagId} className={`text-[9px] font-mono px-2 py-0.5 border rounded-sm ${
                    isLight ? 'border-sky-400/30 text-sky-300 bg-sky-500/5' : 'border-cyan-500/30 text-cyan-300 bg-cyan-500/5'
                  }`}>
                    {tagsDict[tagId] || 'Loading Tag...'}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {proj.blocks?.map((block: any) => {
                if (block.type === 'paragraph') {
                  return <p key={block.id} className={`text-xs leading-relaxed line-clamp-3 whitespace-pre-line ${isLight ? 'text-sky-200/80' : 'text-gray-400'}`}>{block.content}</p>;
                }
                if (block.type === 'gallery' && block.content?.images?.length > 0) {
                  return (
                    <div key={block.id} className="flex gap-2 overflow-x-auto py-1 custom-scrollbar">
                      {block.content.images.slice(0, 4).map((img: string, i: number) => (
                        <img key={i} src={img} alt="Preview" className="w-16 h-16 object-cover border border-white/10 rounded-sm shrink-0 opacity-70" />
                      ))}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (pathname) {
      case '/':
      case '/about': return renderProfile();
      case '/skills': return renderSkills();
      case '/services': return renderServices();
      case '/experience': return renderExperience();
      case '/projects': return renderProjects();
      default: return (
        <div className={`flex flex-col items-center justify-center py-20 font-mono ${isLight ? 'text-sky-300' : 'text-cyan-500'}`}>
          <p className="animate-pulse">GATHERING DATA FROM ORBIT...</p>
        </div>
      );
    }
  };

  return (
    <AnimatePresence>
      {isSummaryMode && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none p-4 md:p-8"
        >
          {/* Backdrop scrim */}
          <div
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/50 pointer-events-auto transition-all"
            onClick={handleClose}
          />

          {/* Frosted-glass modal */}
          <div className={`relative z-10 w-full max-w-5xl max-h-[90vh] overflow-x-hidden overflow-y-auto rounded-lg pointer-events-auto backdrop-blur-3xl flex flex-col custom-scrollbar border transition-all duration-300 ${
            isLight 
              ? 'bg-white/10 border-sky-300/40 shadow-xl shadow-sky-950/50' 
              : 'bg-black/40 border-cyan-500/30 shadow-xl shadow-[0_0_30px_rgba(34,211,238,0.1)]'
          }`}>
            
            {/* Modal Header */}
            <div className={`sticky top-0 z-20 p-4 flex justify-between items-center border-b ${
              isLight ? 'bg-white/5 border-sky-300/20' : 'bg-gray-950/80 border-cyan-500/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${isLight ? 'bg-sky-400' : 'bg-cyan-400'}`} />
                <h2 className={`font-mono tracking-widest text-sm uppercase ${isLight ? 'text-sky-300' : 'text-cyan-400'}`}>
                  CAPTAIN'S LOG: {pathname === '/' ? 'IDENTITY' : pathname.replace('/', '')}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className={`transition-colors ${isLight ? 'text-sky-400 hover:text-white' : 'text-gray-400 hover:text-cyan-400'}`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 md:p-10 relative">
              {renderContent()}
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}