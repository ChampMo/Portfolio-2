'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import { useThemeStore } from '@/lib/store/useThemeStore';
import { Icon } from '@iconify/react';
import {
  X, Download, Calendar, Cpu, Code, Database, Layout,
  Wrench, Briefcase, ChevronRight, ChevronLeft, FolderGit2,
  ExternalLink, Image as ImageIcon, Mail, Phone, MapPin, GraduationCap, Link2, Check, Scroll,
} from 'lucide-react';

interface AboutmeData {
  sectorData: { title: string; description: string };
  personalInfo: { firstName: string; lastName: string; nickname: string; motto: string; description: string; phone: string; email: string; address: string };
  media: { coreImage: string; slideshowImages: string[]; cvUrl: string; cvVisible: boolean; transcriptUrl: string; transcriptVisible: boolean };
  socialLinks: { github: string; linkedin: string; instagram: string; facebook: string };
  education: { universityName: string; universityLogo: string; major: string; timelineStart: string; timelineEnd: string; gpax: string };
}
const defaultAboutme: AboutmeData = {
  sectorData: { title: '', description: '' },
  personalInfo: { firstName: '', lastName: '', nickname: '', motto: '', description: '', phone: '', email: '', address: '' },
  media: { coreImage: '', slideshowImages: [], cvUrl: '', cvVisible: true, transcriptUrl: '', transcriptVisible: true },
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
          if (d && Object.keys(d).length > 0) {
            setAboutmeData({
              ...defaultAboutme,
              ...d,
              media: { ...defaultAboutme.media, ...(d.media ?? {}) },
            });
          }
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
  // 🛠️ RENDER 1: PROFILE (single-page layout)
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
      { label: 'EMAIL',    val: personalInfo.email,   icon: <Mail size={11} />   },
      { label: 'PHONE',    val: personalInfo.phone,   icon: <Phone size={11} />  },
      { label: 'LOCATION', val: personalInfo.address, icon: <MapPin size={11} /> },
    ].filter(c => c.val);

    const eduLine = [education.timelineStart, education.timelineEnd].filter(Boolean).join(' – ')
      + (education.gpax ? ` · GPAX ${education.gpax}` : '');

    const stats = [
      { label: 'PROJECTS',    val: totalProjects,    icon: FolderGit2, clr: isLight ? 'text-fuchsia-400' : 'text-rose-400',   border: isLight ? 'border-fuchsia-400/20' : 'border-rose-500/20'   },
      { label: 'SKILL NODES', val: totalSkills,      icon: Code,       clr: 'text-emerald-400',                               border: 'border-emerald-500/20'                                     },
      { label: 'SERVICES',    val: totalServices,    icon: Cpu,        clr: 'text-amber-400',                                 border: 'border-amber-500/20'                                       },
      { label: 'EXPERIENCE',  val: totalExperiences, icon: Briefcase,  clr: isLight ? 'text-sky-400' : 'text-cyan-400',       border: isLight ? 'border-sky-400/20' : 'border-cyan-500/20'        },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-6"
      >
        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">

          {/* LEFT COL: photo · social · CV */}
          <div className="flex flex-col gap-3">
            {/* Photo frame */}
            <div className={`relative w-full aspect-[3/4] rounded-sm overflow-hidden group border ${
              isLight ? 'bg-white/5 border-sky-300/30' : 'bg-black/60 border-cyan-500/20'
            }`}>
              {/* corner brackets */}
              {(['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2',
                 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'] as const
              ).map((pos, i) => (
                <div key={i} className={`absolute w-4 h-4 z-10 ${pos} ${isLight ? 'border-sky-400' : 'border-cyan-400'}`} />
              ))}
              <AnimatePresence mode="popLayout">
                <motion.img
                  key={currentImageIndex}
                  src={slideshowSrc[currentImageIndex % slideshowSrc.length]}
                  alt="Profile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.9 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 w-full h-full object-cover group-hover:opacity-100 transition-opacity duration-500"
                />
              </AnimatePresence>

              {/* grid flash on transition */}
              <motion.div
                key={`grid-${currentImageIndex}`}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="absolute inset-0 z-1 pointer-events-none"
                style={{
                  backgroundImage: isLight
                    ? 'linear-gradient(rgba(56,189,248,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.3) 1px, transparent 1px)'
                    : 'linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                }}
              />
              {/* glowing scan line sweep */}
              <motion.div
                key={`scan-${currentImageIndex}`}
                initial={{ top: '-2px', opacity: 1 }}
                animate={{ top: '102%', opacity: 0.4 }}
                transition={{ duration: 0.55, ease: 'linear' }}
                className="absolute inset-x-0 h-0.5 z-2 pointer-events-none"
                style={{
                  background: isLight
                    ? 'linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.95) 50%, transparent 100%)'
                    : 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.95) 50%, transparent 100%)',
                  boxShadow: isLight
                    ? '0 0 10px 2px rgba(56,189,248,0.6)'
                    : '0 0 10px 2px rgba(34,211,238,0.65)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              {/* scanning line */}
            </div>

            {/* Social icons */}
            {socialItems.length > 0 && (
              <div className="flex gap-1.5">
                {socialItems.map(s => (
                  <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer"
                    className={`flex-1 flex items-center justify-center p-2.5 border rounded-sm transition-all ${
                      isLight
                        ? 'border-sky-400/30 text-sky-300/70 hover:bg-sky-500/20 hover:border-sky-400 hover:text-sky-200'
                        : 'border-white/10 text-gray-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-cyan-300'
                    }`}
                  >
                    <Icon icon={s.icon} width={20} />
                  </a>
                ))}
              </div>
            )}

            {/* CV Button */}
            {media.cvUrl && media.cvVisible && (
              <a href={media.cvUrl} target="_blank" rel="noopener noreferrer"
                className={`w-full flex items-center justify-center gap-2 py-3 border font-mono font-bold text-xs tracking-widest transition-all ${
                  isLight
                    ? 'bg-sky-500/10 border-sky-400/60 text-sky-300/80 hover:bg-sky-500 hover:text-white hover:border-sky-400'
                    : 'bg-cyan-500/5 border-cyan-500/50 text-cyan-400/80 hover:bg-cyan-400 hover:text-black hover:border-cyan-400'
                }`}
              >
                <Download size={13} /> DOWNLOAD CV
              </a>
            )}

            {/* Transcript Button */}
            {media.transcriptUrl && media.transcriptVisible && (
              <a href={media.transcriptUrl} target="_blank" rel="noopener noreferrer"
                className={`w-full flex items-center justify-center gap-2 py-3 border font-mono font-bold text-xs tracking-widest transition-all ${
                  isLight
                    ? 'bg-sky-500/10 border-sky-400/60 text-sky-300/80 hover:bg-sky-500 hover:text-white hover:border-sky-400'
                    : 'bg-cyan-500/5 border-cyan-500/50 text-cyan-400/80 hover:bg-cyan-400 hover:text-black hover:border-cyan-400'
                }`}
              >
                <Scroll size={13} /> TRANSCRIPT
              </a>
            )}
          </div>

          {/* RIGHT COL: identity + bio + contact + education */}
          <div className="flex flex-col gap-4 min-w-0">

            {/* Name / Nickname / Motto */}
            <div className={`pb-4 border-b ${isLight ? 'border-sky-300/20' : 'border-white/10'}`}>
              <h1 className="text-3xl font-serif text-white tracking-wide leading-tight">{fullName}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                {personalInfo.nickname && (
                  <span className={`font-mono text-xs px-2 py-0.5 border rounded-sm ${
                    isLight ? 'border-sky-400/40 text-sky-300 bg-sky-500/10' : 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'
                  }`}>
                    [ {personalInfo.nickname} ]
                  </span>
                )}
                {personalInfo.motto && (
                  <span className="text-xs text-gray-400 italic">{personalInfo.motto}</span>
                )}
              </div>
            </div>

            {/* Bio */}
            {personalInfo.description && (
              <div className={`p-4 rounded-sm border ${
                isLight ? 'bg-white/5 border-sky-300/20' : 'bg-cyan-950/10 border-cyan-500/15'
              }`}>
                <p className={`text-sm leading-relaxed ${isLight ? 'text-sky-100/90' : 'text-gray-300'}`}>
                  {personalInfo.description}
                </p>
              </div>
            )}

            {/* Contact grid */}
            {contactItems.length > 0 && (
              <div className={`grid gap-px border rounded-sm overflow-hidden ${
                isLight ? 'border-sky-300/20 bg-sky-300/10' : 'border-white/8 bg-white/8'
              }`}>
                {contactItems.map((c, idx) => (
                  <div key={idx} className={`flex items-center gap-3 px-4 py-2.5 ${
                    isLight ? 'bg-white/5' : 'bg-black/30'
                  }`}>
                    <span className={`shrink-0 ${isLight ? 'text-sky-400/60' : 'text-gray-500'}`}>{c.icon}</span>
                    <span className={`text-xs font-mono tracking-widest w-16 shrink-0 ${isLight ? 'text-sky-400/60' : 'text-gray-500'}`}>{c.label}</span>
                    <span className={`text-xs text-white/80 truncate ${isLight ? '' : ''}`}>{c.val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {(education.universityName || education.major) && (
              <div className={`flex items-center gap-4 p-4 rounded-sm border ${
                isLight ? 'bg-white/5 border-sky-300/20' : 'bg-white/3 border-white/8'
              }`}>
                {education.universityLogo && (
                  <img src={education.universityLogo} alt="University" className="w-11 h-11 object-contain shrink-0 opacity-80" />
                )}
                <div className="min-w-0">
                  <p className={`text-xs font-mono mb-1 ${isLight ? 'text-sky-400/60' : 'text-gray-500'}`}>
                    <GraduationCap size={11} className="inline mr-1.5" />ORIGIN
                  </p>
                  {education.universityName && (
                    <p className="text-sm text-white font-serif leading-snug">{education.universityName}</p>
                  )}
                  {education.major && (
                    <p className={`text-xs mt-0.5 ${isLight ? 'text-sky-300' : 'text-cyan-400'}`}>{education.major}</p>
                  )}
                  {eduLine && (
                    <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-sky-200/50' : 'text-gray-600'}`}>{eduLine}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── TELEMETRY STRIP ── */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5 border-t ${
          isLight ? 'border-sky-300/20' : 'border-white/10'
        }`}>
          {stats.map((m, idx) => (
            <div key={idx} className={`relative flex items-center justify-between px-4 py-3.5 border rounded-sm group overflow-hidden transition-all ${
              isLight
                ? `bg-white/5 border-sky-300/15 hover:${m.border} hover:bg-white/8`
                : `bg-black/30 border-white/8 hover:${m.border} hover:bg-white/3`
            }`}>
              {/* glow blob */}
              <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity ${m.clr} bg-current`} />
              <div>
                <p className={`text-xs font-mono tracking-widest mb-1 ${isLight ? 'text-sky-200/50' : 'text-gray-600'}`}>{m.label}</p>
                <p className={`text-2xl font-mono font-bold ${m.clr}`}>{m.val}</p>
              </div>
              <m.icon size={18} className={`${m.clr} opacity-25 group-hover:opacity-70 transition-opacity shrink-0`} />
            </div>
          ))}
        </div>
      </motion.div>
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
        <div className={`relative w-full h-[200px] sm:h-[300px] rounded-sm overflow-hidden border flex items-center justify-center ${
          isLight ? 'border-sky-300/20 bg-white/5' : 'border-white/10 bg-black/40'
        }`}>
          {/* Blurred Background to fill empty space seamlessly */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl"
            style={{ backgroundImage: `url(${proj.coverImage})` }}
          />
          {/* Main Image - contained completely within the box */}
          <img 
            src={proj.coverImage} 
            alt={proj.title} 
            className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain drop-shadow-2xl rounded-lg" 
          />
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