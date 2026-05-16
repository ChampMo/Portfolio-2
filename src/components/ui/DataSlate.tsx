'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import { X, Download, ExternalLink, MapPin, Calendar } from 'lucide-react';
import { Icon } from '@iconify/react';

// ดึง Mock Data
import { profileData } from '@/lib/mock/profile';
import { skillsData } from '@/lib/mock/skills';
import { projectsData } from '@/lib/mock/projects';
import { servicesData } from '@/lib/mock/services';
import { experienceData } from '@/lib/mock/experience';

const statusStyles: Record<string, string> = {
  DEPLOYED: 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300',
  IN_ORBIT: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
  ARCHIVED: 'bg-white/5 border-white/20 text-gray-400',
};

const socialLinks = [
  { name: 'GitHub', icon: 'mdi:github', url: profileData.socials.github },
  { name: 'LinkedIn', icon: 'mdi:linkedin', url: profileData.socials.linkedin },
  { name: 'Instagram', icon: 'mdi:instagram', url: profileData.socials.instagram },
  { name: 'Facebook', icon: 'mdi:facebook', url: profileData.socials.facebook },
];

// 🌟 รายการรูปภาพสำหรับ Slideshow (คุณสามารถเพิ่ม/ลด ได้ตามต้องการ)
// นำรูปไปวางไว้ในโฟลเดอร์ public/textures/
const profileImages = [
  '/textures/me.png',       // รูปที่ 1
  '/textures/me2.png',      // รูปที่ 2 (สมมติ)
  '/textures/me3.png',      // รูปที่ 3 (สมมติ)
];

export default function DataSlate() {
  const isSummaryMode = useAppStore((state) => state.isSummaryMode);
  const toggleSummaryMode = useAppStore((state) => state.toggleSummaryMode);
  const pathname = usePathname(); 

  // 🌟 State สำหรับ Slideshow
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 🌟 Effect สำหรับเปลี่ยนรูปอัตโนมัติทุกๆ 3 วินาที
  useEffect(() => {
    if (!isSummaryMode || pathname !== '/' && pathname !== '/about') return;

    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % profileImages.length);
    }, 3000); // 3000 ms = 3 วินาที

    return () => clearInterval(intervalId);
  }, [isSummaryMode, pathname]);

  // 🛠️ ฟังก์ชันสำหรับ Render ข้อมูลหน้า About Me (พิกัด: '/')
  // 🛠️ ฟังก์ชันสำหรับ Render ข้อมูลหน้า About Me (พิกัด: '/')
  const renderProfile = () => (
    <div className="flex flex-col lg:flex-row gap-10">
      
      {/* 🌟 LEFT PANEL: ID Card & Actions */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        
        {/* กรอบรูป Slideshow แบบ Sci-Fi HUD */}
        <div className="relative w-full aspect-square md:aspect-[4/5] rounded-sm bg-black/60 shadow-[0_0_20px_rgba(34,211,238,0.1)] group overflow-hidden">
          {/* มุมกรอบโฮโลแกรม */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400 z-10" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400 z-10" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400 z-10" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400 z-10" />

          <AnimatePresence mode="popLayout">
            <motion.img
              key={currentImageIndex}
              src={profileImages[currentImageIndex]}
              alt="Profile Slideshow"
              initial={{ opacity: 0, filter: 'blur(5px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(5px)' }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          </AnimatePresence>
          {/* เอฟเฟกต์แรเงาด้านล่างให้กลืนกับพื้น */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-0 pointer-events-none" />
        </div>

        {/* ชื่อและตำแหน่ง */}
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-white tracking-wider mb-1">{profileData.name}</h1>
          <p className="font-mono text-cyan-400 text-sm animate-pulse">[{profileData.role}]</p>
        </div>

        {/* ไอคอนโซเชียล */}
        <div className="flex flex-wrap gap-3">
          {socialLinks.map((social, idx) => (
            <a key={idx} href={social.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 border border-white/10 rounded-sm text-gray-400 hover:text-black hover:bg-cyan-400 hover:border-cyan-400 transition-all">
              <Icon icon={social.icon} width="20" height="20" />
            </a>
          ))}
        </div>

        {/* ปุ่ม Download CV (ย้ายมาเป็น Action หลักของ ID Card) */}
        <button className="mt-auto w-full flex items-center justify-center gap-3 px-6 py-4 bg-cyan-500/10 border border-cyan-500 text-cyan-400 font-mono font-bold text-xs tracking-widest hover:bg-cyan-400 hover:text-black transition-all group">
          <Download size={18} className="group-hover:-translate-y-1 transition-transform" /> [ DOWNLOAD CV ]
        </button>
      </div>
      
      {/* 🌟 RIGHT PANEL: Detailed Information */}
      <div className="w-full lg:w-2/3 space-y-10">
        
        {/* Motto & Intro */}
        <div className="relative p-6 bg-cyan-950/20 border border-cyan-500/20 rounded-sm">
          <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-transparent" />
          <p className="font-mono text-cyan-300 text-xs tracking-widest uppercase mb-4">"{profileData.motto}"</p>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">{profileData.intro}</p>
        </div>

        {/* Transmission Data (ข้อมูลติดต่อจัดใหม่แบบ Dashboard) */}
        <div>
          <h3 className="font-mono text-cyan-500 tracking-widest text-xs mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" />
            TRANSMISSION DATA
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 border border-white/5 rounded-sm hover:border-cyan-500/30 transition-colors">
              <p className="text-[10px] text-gray-500 font-mono tracking-widest mb-1">NICKNAME</p>
              <p className="text-sm text-white">{profileData.nickname}</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/5 rounded-sm hover:border-cyan-500/30 transition-colors">
              <p className="text-[10px] text-gray-500 font-mono tracking-widest mb-1">PHONE</p>
              <p className="text-sm text-cyan-400 font-mono">{profileData.contact.phone}</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/5 rounded-sm hover:border-cyan-500/30 transition-colors">
              <p className="text-[10px] text-gray-500 font-mono tracking-widest mb-1">EMAIL</p>
              <p className="text-sm text-cyan-400 font-mono truncate">{profileData.contact.email}</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/5 rounded-sm hover:border-cyan-500/30 transition-colors">
              <p className="text-[10px] text-gray-500 font-mono tracking-widest mb-1">BASE LOCATION</p>
              <p className="text-sm text-white truncate">{profileData.contact.address}</p>
            </div>
          </div>
        </div>

        {/* Education (จัดใหม่เป็น Timeline) */}
        <div>
          <h3 className="font-mono text-cyan-500 tracking-widest text-xs mb-5 border-b border-white/10 pb-2">ORIGIN [ EDUCATION ]</h3>
          <div className="relative pl-6 border-l border-cyan-500/30">
            {/* จุด Node บนไทม์ไลน์ */}
            <span className="absolute -left-[5px] top-1.5 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]" />
            
            <h4 className="text-lg md:text-xl font-serif text-white leading-tight">{profileData.education.university}</h4>
            <p className="font-mono text-cyan-400 text-xs mt-1.5 mb-4">{profileData.education.major}</p>
            
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs font-mono">
              <p><span className="text-gray-500 tracking-widest">TIMELINE:</span> <span className="text-gray-300">{profileData.education.time}</span></p>
              <p><span className="text-gray-500 tracking-widest">GPA:</span> <span className="text-cyan-300">{profileData.education.gpa}</span></p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  // 🛠️ ฟังก์ชันสำหรับ Render ข้อมูล Skills (พิกัด: '/skills')
  const renderSkills = () => (
    <div className="space-y-8">
      <div className="border-b border-cyan-500/30 pb-4">
        <h1 className="text-3xl font-serif text-white mb-2">{skillsData.title}</h1>
        <p className="font-mono text-cyan-400 text-sm">{skillsData.description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skillsData.categories.map((cat, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-sm">
            <h3 className="font-mono text-cyan-500 tracking-widest text-sm mb-4">{cat.name}</h3>
            <div className="flex flex-wrap gap-2">
              {cat.items.map((item, i) => (
                <span key={i} className="px-3 py-1 bg-black/40 border border-cyan-500/30 text-gray-300 text-xs font-mono rounded-full">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 🛠️ Render: Services (พิกัด: '/services')
  const renderServices = () => (
    <div className="space-y-8">
      <div className="border-b border-cyan-500/30 pb-4">
        <h1 className="text-3xl font-serif text-white mb-2">{servicesData.title}</h1>
        <p className="font-mono text-cyan-400 text-sm">{servicesData.description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {servicesData.services.map((svc) => (
          <div
            key={svc.id}
            className="group bg-white/5 border border-white/10 hover:border-cyan-500/40 p-6 rounded-sm transition-all"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-sm text-cyan-300 group-hover:bg-cyan-500/20 transition-all">
                <Icon icon={svc.icon} width="24" height="24" />
              </div>
              <div>
                <h3 className="font-serif text-white text-lg leading-tight">{svc.name}</h3>
                <p className="font-mono text-cyan-400 text-xs mt-1">{svc.tagline}</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">{svc.description}</p>
            <ul className="space-y-1.5">
              {svc.deliverables.map((d, i) => (
                <li key={i} className="flex gap-2 text-xs font-mono text-gray-400">
                  <span className="text-cyan-500">›</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  // 🛠️ Render: Experience (พิกัด: '/experience')
  const renderExperience = () => (
    <div className="space-y-8">
      <div className="border-b border-cyan-500/30 pb-4">
        <h1 className="text-3xl font-serif text-white mb-2">{experienceData.title}</h1>
        <p className="font-mono text-cyan-400 text-sm">{experienceData.description}</p>
      </div>
      <ol className="relative border-l border-cyan-500/30 ml-2 space-y-8">
        {experienceData.entries.map((entry) => (
          <li key={entry.id} className="pl-6 relative">
            <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-cyan-500/20" />
            <div className="flex flex-wrap items-baseline gap-2 mb-1">
              <h3 className="font-serif text-white text-lg">{entry.role}</h3>
              <span className="font-mono text-[10px] tracking-widest px-2 py-0.5 border border-cyan-500/30 text-cyan-300 rounded-sm">
                {entry.type}
              </span>
            </div>
            <p className="font-mono text-cyan-400 text-xs mb-3">{entry.organization}</p>
            <div className="flex flex-wrap gap-4 text-[11px] font-mono text-gray-500 mb-3">
              <span className="flex items-center gap-1"><Calendar size={12} />{entry.time}</span>
              <span className="flex items-center gap-1"><MapPin size={12} />{entry.location}</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">{entry.summary}</p>
            <ul className="space-y-1.5 mb-3">
              {entry.achievements.map((a, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-400">
                  <span className="text-cyan-500 font-mono">›</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
            {entry.stack && entry.stack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {entry.stack.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-black/40 border border-cyan-500/20 text-gray-400 text-[10px] font-mono rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );

  // 🛠️ Render: Projects (พิกัด: '/projects')
  const renderProjects = () => (
    <div className="space-y-8">
      <div className="border-b border-cyan-500/30 pb-4">
        <h1 className="text-3xl font-serif text-white mb-2">{projectsData.title}</h1>
        <p className="font-mono text-cyan-400 text-sm">{projectsData.description}</p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {projectsData.projects.map((p) => (
          <div
            key={p.id}
            className="group bg-white/5 border border-white/10 hover:border-cyan-500/40 p-6 rounded-sm transition-all"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-mono text-[10px] tracking-widest text-cyan-500 mb-1">
                  {p.codename} · {p.year}
                </p>
                <h3 className="font-serif text-white text-xl">{p.name}</h3>
                <p className="font-mono text-cyan-400 text-xs mt-1">{p.role}</p>
              </div>
              <span
                className={`font-mono text-[10px] tracking-widest px-2 py-1 border rounded-sm ${statusStyles[p.status] ?? statusStyles.ARCHIVED}`}
              >
                {p.status}
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">{p.description}</p>
            <ul className="space-y-1.5 mb-4">
              {p.highlights.map((h, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-400">
                  <span className="text-cyan-500 font-mono">›</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <div className="flex flex-wrap gap-1.5">
                {p.stack.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-black/40 border border-cyan-500/30 text-gray-300 text-[10px] font-mono rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                {p.links?.repo && (
                  <a
                    href={p.links.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 hover:border-cyan-400 text-gray-300 hover:text-cyan-400 text-xs font-mono transition-all"
                  >
                    <Icon icon="mdi:github" width="14" height="14" /> REPO
                  </a>
                )}
                {p.links?.live && (
                  <a
                    href={p.links.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono transition-all"
                  >
                    <ExternalLink size={14} /> LIVE
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 🧠 Logic เลือก Render ข้อมูลตาม URL ปัจจุบัน
  const renderContent = () => {
    switch (pathname) {
      case '/':
      case '/about': return renderProfile();
      case '/skills': return renderSkills();
      case '/services': return renderServices();
      case '/experience': return renderExperience();
      case '/projects': return renderProjects();
      default: return (
        <div className="flex flex-col items-center justify-center py-20 text-cyan-500 font-mono">
          <p className="animate-pulse">GATHERING DATA FROM ORBIT...</p>
        </div>
      );
    }
  };

  return (
    <AnimatePresence>
      {isSummaryMode && (
        <motion.div
          initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none p-4 md:p-8"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md pointer-events-auto" onClick={toggleSummaryMode} />
          <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-black/60 border border-cyan-500/30 rounded-lg shadow-[0_0_30px_rgba(34,211,238,0.1)] pointer-events-auto backdrop-blur-xl flex flex-col custom-scrollbar">
            
            <div className="sticky top-0 bg-black/80 border-b border-cyan-500/30 p-4 flex justify-between items-center z-20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                <h2 className="font-mono text-cyan-400 tracking-widest text-sm uppercase">
                  CAPTAIN'S LOG: {pathname === '/' ? 'IDENTITY' : pathname.replace('/', '')}
                </h2>
              </div>
              <button onClick={toggleSummaryMode} className="text-gray-400 hover:text-cyan-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* แสดงผลเนื้อหาที่เลือกไว้ */}
            <div className="p-6 md:p-10">
              {renderContent()}
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}