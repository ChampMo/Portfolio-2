'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import { useThemeStore } from '@/lib/store/useThemeStore';
import { Icon } from '@iconify/react';
import {
  X, Download, Calendar, Cpu, Code, Database, Layout,
  Wrench, Briefcase, ChevronRight, ChevronLeft, Activity, ShieldCheck, FolderGit2,
  ExternalLink, Image as ImageIcon, Mail, Phone, MapPin, GraduationCap, Link2, Check,
} from 'lucide-react';

interface AboutmeData {
  sectorData: { title: string; description: string };
  personalInfo: { firstName: string; lastName: string; nickname: string; motto: string; description: string; phone: string; email: string; address: string };
  media: { coreImage: string; slideshowImages: string[]; cvUrl: string };
  socialLinks: { github: string; linkedin: string; instagram: string; facebook: string };
  education: { universityName: string; universityLogo: string; major: string; timelineStart: string; timelineEnd: string; gpax: string };
}
const defaultAboutme: AboutmeData = {
  sectorData: { title: '', description: '' },
  personalInfo: { firstName: '', lastName: '', nickname: '', motto: '', description: '', phone: '', email: '', address: '' },
  media: { coreImage: '', slideshowImages: [], cvUrl: '' },
  socialLinks: { github: '', linkedin: '', instagram: '', facebook: '' },
  education: { universityName: '', universityLogo: '', major: '', timelineStart: '', timelineEnd: '', gpax: '' },
};

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
  const focusedProjectId = useAppStore((state) => state.focusedProjectId);
  const setFocusedProjectId = useAppStore((state) => state.setFocusedProjectId);
  const theme = useThemeStore((s) => s.theme); 
  const isLight = theme === 'light';

  const pathname = usePathname();
  const router = useRouter();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [aboutPage, setAboutPage] = useState<1 | 2>(1);
  const [copied, setCopied] = useState(false);

  const handleShare = async (proj: any) => {
    const url = `${window.location.origin}/projects/${proj._id}`;
    if (navigator.share) {
      await navigator.share({ title: proj.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [projects, setProjects] = useState<any[]>([]);
  const [tagsDict, setTagsDict] = useState<Record<string, string>>({});
  const [servicesData, setServicesData] = useState<any>({ sectorData: {}, services: [] });
  const [experienceData, setExperienceData] = useState<any>({ sectorData: {}, experiences: [] });
  const [skillsData, setSkillsData] = useState<any>({ sectorData: {}, skills: { languages: [], database: [], frameworks: [], tools: [] } });
  const [aboutmeData, setAboutmeData] = useState<AboutmeData>(defaultAboutme);
  const [projectsSectorData, setProjectsSectorData] = useState({ title: '[ CONSTELLATION ]', description: '' });

  const slideshowSrc = useMemo(() => {
    if (aboutmeData.media.slideshowImages.length > 0) return aboutmeData.media.slideshowImages;
    if (aboutmeData.media.coreImage) return [aboutmeData.media.coreImage];
    return profileImages;
  }, [aboutmeData.media.coreImage, aboutmeData.media.slideshowImages]);

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

  // Sync URL /projects/[id] → focusedProjectId store (e.g. direct navigation / share link)
  useEffect(() => {
    if (pathname.startsWith('/projects/')) {
      const projId = pathname.split('/').pop();
      if (projId) setFocusedProjectId(projId);
    }
  }, [pathname, setFocusedProjectId]);

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

        const aboutmeRes = await fetch('/api/aboutme');
        if (aboutmeRes.ok) {
          const d = await aboutmeRes.json();
          if (d && Object.keys(d).length > 0) setAboutmeData(d);
        }

        const projMetaRes = await fetch('/api/projects/meta');
        if (projMetaRes.ok) {
          const d = await projMetaRes.json();
          if (d?.sectorData) setProjectsSectorData(d.sectorData);
        }

      } catch (error) {
        console.error('[ TELEMETRY FETCH FAILED ]', error);
      }
    };

    fetchAllTelemetry();
  }, [isSummaryMode]);

  useEffect(() => {
    if (!isSummaryMode || (pathname !== '/' && pathname !== '/about')) return;
    if (slideshowSrc.length <= 1) return;
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % slideshowSrc.length);
    }, 3000);
    return () => clearInterval(intervalId);
  }, [isSummaryMode, pathname, slideshowSrc.length]);

  // ========================================================
  // 🛠️ RENDER 1: PROFILE (รองรับระบบ 2 หน้า)
  // ========================================================
  const renderProfile = () => {
    const totalSkills = Object.values(skillsData?.skills || {}).reduce((acc: number, arr: any) => acc + (arr?.length || 0), 0) as number;
    const totalProjects = projects.length || 0;
    const totalServices = servicesData?.services?.length || 0;
    const totalExperiences = experienceData?.experiences?.length || 0;

    const { personalInfo, media, education, socialLinks } = aboutmeData;
    const fullName = [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(' ') || 'Monthol Sukjinda';

    const socialItems = [
      { key: 'github',    url: socialLinks.github,    icon: 'mdi:github'    },
      { key: 'linkedin',  url: socialLinks.linkedin,  icon: 'mdi:linkedin'  },
      { key: 'instagram', url: socialLinks.instagram, icon: 'mdi:instagram' },
      { key: 'facebook',  url: socialLinks.facebook,  icon: 'mdi:facebook'  },
    ].filter(s => s.url);

    const contactItems = [
      { label: 'EMAIL',    val: personalInfo.email,   icon: <Mail size={13} />   },
      { label: 'PHONE',    val: personalInfo.phone,   icon: <Phone size={13} />  },
      { label: 'LOCATION', val: personalInfo.address, icon: <MapPin size={13} /> },
    ].filter(c => c.val);

    const eduLine = [education.timelineStart, education.timelineEnd].filter(Boolean).join(' – ')
      + (education.gpax ? ` · GPAX ${education.gpax}` : '');

    return (
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          {aboutPage === 1 ? (
            <motion.div
              key="page1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col lg:flex-row gap-8"
            >
              {/* ===== LEFT: Photo + Name + Social + CV ===== */}
              <div className="w-full lg:w-1/3 flex flex-col gap-4">
                <div className={`relative w-full aspect-square md:aspect-[4/5] rounded-sm overflow-hidden group border ${
                  isLight ? 'bg-white/5 border-sky-300/30' : 'bg-black/60 border-cyan-500/20'
                }`}>
                  <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 z-10 ${isLight ? 'border-sky-400' : 'border-cyan-400'}`} />
                  <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 z-10 ${isLight ? 'border-sky-400' : 'border-cyan-400'}`} />
                  <AnimatePresence mode="popLayout">
                    <motion.img
                      key={currentImageIndex}
                      src={slideshowSrc[currentImageIndex % slideshowSrc.length]}
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
                  <h1 className="text-2xl font-serif text-white tracking-wider mb-0.5">{fullName}</h1>
                  {personalInfo.nickname && (
                    <p className={`font-mono text-sm ${isLight ? 'text-sky-300' : 'text-cyan-400'}`}>[ {personalInfo.nickname} ]</p>
                  )}
                  {personalInfo.motto && (
                    <p className="text-sm text-gray-400 italic mt-1">{personalInfo.motto}</p>
                  )}
                </div>

                {socialItems.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {socialItems.map(s => (
                      <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer"
                        className={`p-2 border rounded-sm transition-all ${
                          isLight
                            ? 'border-sky-400/30 text-sky-300 hover:bg-sky-500/20 hover:border-sky-400'
                            : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400'
                        }`}
                      >
                        <Icon icon={s.icon} width={16} />
                      </a>
                    ))}
                  </div>
                )}

                {media.cvUrl ? (
                  <a href={media.cvUrl} target="_blank" rel="noopener noreferrer"
                    className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 border font-mono font-bold text-xs tracking-widest transition-all ${
                      isLight
                        ? 'bg-sky-500/10 border-sky-400 text-sky-300 hover:bg-sky-500 hover:text-white'
                        : 'bg-cyan-500/10 border-cyan-500 text-cyan-400 hover:bg-cyan-400 hover:text-black'
                    }`}
                  >
                    <Download size={16} /> [ DOWNLOAD CV ]
                  </a>
                ) : (
                  <div className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border font-mono text-xs tracking-widest opacity-30 border-white/10 text-gray-500">
                    <Download size={16} /> [ NO CV UPLOADED ]
                  </div>
                )}
              </div>

              {/* ===== RIGHT: Info ===== */}
              <div className="w-full lg:w-2/3 flex flex-col gap-5">
                {personalInfo.description && (
                  <div className={`p-5 rounded-sm border ${isLight ? 'bg-white/5 border-sky-300/20' : 'bg-cyan-950/10 border-cyan-500/20'}`}>
                    <p className={`text-base leading-relaxed ${isLight ? 'text-sky-100' : 'text-gray-300'}`}>{personalInfo.description}</p>
                  </div>
                )}

                {contactItems.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {contactItems.map((c, idx) => (
                      <div key={idx} className={`p-4 rounded-sm border ${isLight ? 'bg-white/5 border-sky-300/20' : 'bg-white/5 border-white/5'}`}>
                        <p className={`text-xs font-mono flex items-center gap-1.5 mb-1 ${isLight ? 'text-sky-400/70' : 'text-gray-500'}`}>
                          {c.icon} {c.label}
                        </p>
                        <p className="text-base text-white break-all">{c.val}</p>
                      </div>
                    ))}
                  </div>
                )}

                {(education.universityName || education.major) && (
                  <div className={`p-5 rounded-sm border ${isLight ? 'bg-white/5 border-sky-300/20' : 'bg-white/5 border-white/5'}`}>
                    <p className={`text-xs font-mono flex items-center gap-1.5 mb-3 ${isLight ? 'text-sky-400/70' : 'text-gray-500'}`}>
                      <GraduationCap size={13} /> ORIGIN (EDUCATION)
                    </p>
                    <div className="flex items-center gap-4">
                      {education.universityLogo && (
                        <img src={education.universityLogo} alt="University" className="w-14 h-14 object-contain shrink-0 opacity-90" />
                      )}
                      <div>
                        {education.universityName && <p className="text-base text-white font-serif">{education.universityName}</p>}
                        {education.major && <p className={`text-sm mt-0.5 ${isLight ? 'text-sky-300' : 'text-cyan-400'}`}>{education.major}</p>}
                        {eduLine && <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-sky-200/60' : 'text-gray-500'}`}>{eduLine}</p>}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-auto pt-2">
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
                      <p className={`text-xs font-mono tracking-widest uppercase ${isLight ? 'text-sky-200/60' : 'text-gray-500'}`}>{m.label}</p>
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
            <p className={`text-sm leading-relaxed whitespace-pre-line break-words max-h-28 overflow-y-auto custom-scrollbar pr-2 ${isLight ? 'text-sky-200/80' : 'text-gray-400'}`}>{svc.description}</p>
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
              <span className={`font-mono text-xs border px-2 py-1 rounded-sm ${
                isLight ? 'bg-sky-500/10 border-sky-400/30 text-sky-300' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}>{exp.time}</span>
            </div>
            <ul className="space-y-1.5">
              {exp.details?.map((detail: string, i: number) => (
                <li key={i} className={`flex gap-2 text-sm ${isLight ? 'text-sky-200/80' : 'text-gray-400'}`}>
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
  // 🛠️ RENDER 5a: PROJECT DETAIL
  // ========================================================
  const renderProjectDetail = (proj: any) => (
    <div className="space-y-6">
      {/* Back button + Share button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setFocusedProjectId(null);
            router.push('/projects');
          }}
          className={`flex items-center gap-2 text-xs font-mono tracking-widest transition-colors ${
            isLight ? 'text-sky-300/60 hover:text-sky-200' : 'text-gray-500 hover:text-cyan-400'
          }`}
        >
          <ChevronLeft size={14} /> BACK TO CONSTELLATION
        </button>
        <button
          onClick={() => handleShare(proj)}
          className={`flex items-center gap-1.5 text-xs font-mono tracking-widest px-3 py-1.5 rounded-sm border transition-all ${
            copied
              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
              : isLight
                ? 'text-sky-300/70 border-sky-300/20 hover:text-sky-200 hover:border-sky-400 hover:bg-sky-500/10'
                : 'text-gray-500 border-white/10 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5'
          }`}
        >
          {copied ? <><Check size={13} /> COPIED!</> : <><Link2 size={13} /> SHARE</>}
        </button>
      </div>

      {/* Cover image */}
      {proj.coverImage && (
        <div className={`w-full rounded-sm overflow-hidden border ${isLight ? 'border-sky-300/20' : 'border-white/10'}`}>
          <img src={proj.coverImage} alt={proj.title} className="w-full max-h-72 object-cover opacity-90" />
        </div>
      )}

      {/* Title + meta */}
      <div className="space-y-3">
        <h1 className="text-3xl font-serif text-white">{proj.title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`font-mono text-xs flex items-center gap-1.5 ${isLight ? 'text-sky-300' : 'text-cyan-400'}`}>
            <Calendar size={13} /> {proj.time}
          </span>
          {proj.tags?.map((tagId: string) => (
            <span key={tagId} className={`text-xs font-mono px-2 py-0.5 border rounded-sm ${
              isLight ? 'border-sky-400/30 text-sky-300 bg-sky-500/5' : 'border-cyan-500/30 text-cyan-300 bg-cyan-500/5'
            }`}>
              {tagsDict[tagId] || tagId}
            </span>
          ))}
        </div>
      </div>

      {/* Content blocks */}
      <div className="space-y-5">
        {proj.blocks?.map((block: any) => {
          if (block.type === 'heading') {
            return (
              <h2 key={block.id} className={`text-xl font-serif pt-2 border-t ${
                isLight ? 'text-white border-sky-300/10' : 'text-white border-white/5'
              }`}>
                {block.content}
              </h2>
            );
          }
          if (block.type === 'paragraph') {
            return (
              <p key={block.id} className={`text-sm leading-relaxed whitespace-pre-line ${
                isLight ? 'text-sky-100/80' : 'text-gray-300'
              }`}>
                {block.content}
              </p>
            );
          }
          if (block.type === 'link' && block.content) {
            return (
              <a
                key={block.id}
                href={block.content}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 text-sm font-mono px-4 py-2.5 border rounded-sm transition-all ${
                  isLight
                    ? 'border-sky-400/30 text-sky-300 bg-sky-500/5 hover:bg-sky-500/20'
                    : 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10'
                }`}
              >
                <ExternalLink size={14} /> {block.content}
              </a>
            );
          }
          if (block.type === 'gallery' && block.content?.images?.length > 0) {
            const imgHeight = block.content.height ?? 200;
            return (
              <div key={block.id} className="space-y-2">
                {block.content.title && (
                  <p className={`text-xs font-mono tracking-widest flex items-center gap-1.5 ${
                    isLight ? 'text-sky-300/60' : 'text-gray-500'
                  }`}>
                    <ImageIcon size={13} /> {block.content.title}
                  </p>
                )}
                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1">
                  {block.content.images.map((img: string, i: number) => (
                    <img
                      key={i}
                      src={img}
                      alt={`img-${i}`}
                      style={{ height: `${imgHeight}px` }}
                      className="object-cover rounded-sm border border-white/10 shrink-0 max-w-none"
                    />
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );

  // ========================================================
  // 🛠️ RENDER 5b: PROJECTS LIST
  // ========================================================
  const renderProjects = () => {
    const focusedProj = focusedProjectId
      ? projects.find((p) => String(p._id) === focusedProjectId)
      : null;

    if (focusedProj) return renderProjectDetail(focusedProj);

    return (
      <div className="space-y-8">
        <div className={`border-b pb-4 ${isLight ? 'border-sky-300/20' : 'border-cyan-500/30'}`}>
          <h1 className="text-3xl font-serif mb-2" style={{ color: '#ffffff' }}>{projectsSectorData.title || '[ CONSTELLATION ]'}</h1>
          <p className={`font-mono text-sm ${isLight ? 'text-sky-300' : 'text-cyan-400'}`}>{projectsSectorData.description || 'Stellar deployment logs and automated testing case studies.'}</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {projects.map((proj, index) => (
            <button
              key={index}
              onClick={() => {
                router.push(`/projects/${String(proj._id)}`);
                setFocusedProjectId(String(proj._id));
              }}
              className={`w-full text-left border p-6 rounded-sm space-y-3 transition-all group ${
                isLight
                  ? 'bg-white/5 border-sky-300/20 hover:border-sky-400 hover:bg-white/10'
                  : 'bg-black/30 border-white/10 hover:border-fuchsia-500/50 hover:bg-fuchsia-950/10'
              }`}
            >
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <h3 className={`font-serif text-xl transition-colors ${
                    isLight ? 'text-white group-hover:text-sky-200' : 'text-white group-hover:text-fuchsia-300'
                  }`}>
                    {proj.title}
                  </h3>
                  <p className={`font-mono text-xs mt-1 flex items-center gap-1.5 ${isLight ? 'text-sky-300' : 'text-cyan-400'}`}>
                    <Calendar size={13} /> {proj.time}
                  </p>
                </div>
                <ChevronRight size={16} className={`shrink-0 transition-all mt-1 ${
                  isLight ? 'text-sky-300/40 group-hover:text-sky-300 group-hover:translate-x-1' : 'text-gray-600 group-hover:text-fuchsia-400 group-hover:translate-x-1'
                }`} />
              </div>
              <div className="flex flex-wrap gap-1">
                {proj.tags?.map((tagId: string) => (
                  <span key={tagId} className={`text-xs font-mono px-2 py-0.5 border rounded-sm ${
                    isLight ? 'border-sky-400/30 text-sky-300 bg-sky-500/5' : 'border-cyan-500/30 text-cyan-300 bg-cyan-500/5'
                  }`}>
                    {tagsDict[tagId] || tagId}
                  </span>
                ))}
              </div>
              {/* First paragraph block as preview */}
              {proj.blocks?.find((b: any) => b.type === 'paragraph')?.content && (
                <p className={`text-sm leading-relaxed line-clamp-2 ${isLight ? 'text-sky-200/60' : 'text-gray-500'}`}>
                  {proj.blocks.find((b: any) => b.type === 'paragraph').content}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (pathname.startsWith('/projects/')) {
      const projId = pathname.split('/').pop();
      const proj = projId ? projects.find((p) => String(p._id) === projId) : null;
      if (proj) return renderProjectDetail(proj);
    }
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
              {(() => {
                const detailProj = (() => {
                  if (pathname.startsWith('/projects/')) {
                    const id = pathname.split('/').pop();
                    return projects.find((p) => String(p._id) === id) || null;
                  }
                  if (pathname === '/projects' && focusedProjectId) {
                    return projects.find((p) => String(p._id) === focusedProjectId) || null;
                  }
                  return null;
                })();
                const label = detailProj
                  ? detailProj.title
                  : pathname === '/' ? 'IDENTITY' : pathname.replace('/', '').toUpperCase();
                return (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-3 h-3 rounded-full animate-pulse shrink-0 ${isLight ? 'bg-sky-400' : 'bg-cyan-400'}`} />
                    <h2 className={`font-mono tracking-widest text-sm uppercase truncate ${isLight ? 'text-sky-300' : 'text-cyan-400'}`}>
                      {detailProj ? '◈ ' : 'CAPTAIN\'S LOG: '}{label}
                    </h2>
                  </div>
                );
              })()}
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