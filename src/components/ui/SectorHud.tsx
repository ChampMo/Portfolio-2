'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { useThemeStore } from '@/lib/store/useThemeStore';
import {
  Hexagon,
  Code2,
  Cpu,
  Clock,
  FolderGit2,
  Orbit,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { profileData } from '@/lib/mock/profile';

type Stat = { label: string; value: string };

type Sector = {
  code: string;
  name: string;
  brief: string;
  icon: LucideIcon;
  accent: string;
  accentBorder: string;
  stats: Stat[];
};

export default function SectorHud() {
  const isSystemBooted = useAppStore((s) => s.isSystemBooted);
  const remotePlayers = useAppStore((s) => s.remotePlayers);
  const activeExplorerCount = remotePlayers.length + 1;
  const theme = useThemeStore((s) => s.theme);
  const isLight = theme === 'light';
  const pathname = usePathname() ?? '/';

  // 🌟 State สำหรับจัดเก็บการเปิด/ปิดแผงข้อมูล
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [liveStats, setLiveStats] = useState({
    projectsCount: 0,
    skillsCategoriesCount: 0,
    skillsTotalItems: 0,
    servicesCount: 0,
    expCount: 0,
    expRange: '—',
  });

  useEffect(() => {
    if (!isSystemBooted) return;

    const fetchLiveTelemetry = async () => {
      try {
        const [projRes, skillsRes, svcsRes, expRes] = await Promise.all([
          fetch('/api/projects').catch(() => null),
          fetch('/api/skills').catch(() => null),
          fetch('/api/services').catch(() => null),
          fetch('/api/experience').catch(() => null),
        ]);

        let pCount = 0;
        if (projRes?.ok) {
          const pData = await projRes.json();
          pCount = pData.length || 0;
        }

        let sCats = 0;
        let sItems = 0;
        if (skillsRes?.ok) {
          const sData = await skillsRes.json();
          const core = sData?.skills || {};
          sCats = Object.keys(core).length;
          sItems = Object.values(core).reduce((acc: number, arr: any) => acc + (arr?.length || 0), 0);
        }

        let svcCount = 0;
        if (svcsRes?.ok) {
          const svcData = await svcsRes.json();
          svcCount = svcData?.services?.length || 0;
        }

        let eCount = 0;
        let eRange = '—';
        if (expRes?.ok) {
          const eData = await expRes.json();
          const entries = eData?.experiences || [];
          eCount = entries.length;

          const years = entries.map((e: any) => e.time?.match(/\d{4}/g) || []).flat().map(Number);
          if (years.length > 0) {
            const min = Math.min(...years);
            const max = Math.max(...years);
            eRange = min === max ? `${min}` : `${min}–${max}`;
          }
        }

        setLiveStats({
          projectsCount: pCount,
          skillsCategoriesCount: sCats,
          skillsTotalItems: sItems,
          servicesCount: svcCount,
          expCount: eCount,
          expRange: eRange,
        });

      } catch (error) {
        console.error('[ HUD TELEMETRY ERROR ]', error);
      }
    };

    fetchLiveTelemetry();
  }, [isSystemBooted]);

  const SECTORS: Record<string, Sector> = {
    '/': {
      code: 'SECTOR-00',
      name: 'COSMIC OVERVIEW',
      brief: 'Full system view — all orbital bodies in motion.',
      icon: Orbit,
      accent: isLight ? 'text-sky-300' : 'text-cyan-700 dark:text-cyan-300',
      accentBorder: isLight ? 'border-sky-300/40' : 'border-cyan-500/40 dark:border-cyan-400/50',
      stats: [
        { label: 'PLANETS', value: '4' },
        { label: 'CORE', value: '1' },
        { label: 'PROJECTS', value: String(liveStats.projectsCount) },
        { label: 'SKILLS', value: String(liveStats.skillsTotalItems) },
      ],
    },
    '/about': {
      code: 'SECTOR-01',
      name: 'IDENTITY CORE',
      brief: 'Operator profile and origin telemetry.',
      icon: Hexagon,
      accent: isLight ? 'text-fuchsia-400' : 'text-fuchsia-700 dark:text-fuchsia-300',
      accentBorder: isLight ? 'border-sky-300/40' : 'border-fuchsia-500/40 dark:border-fuchsia-400/50',
      stats: [
        { label: 'OPERATOR', value: profileData.nickname },
        { label: 'ROLE', value: profileData.role.split(' ')[0] },
        { label: 'GPA', value: profileData.education.gpa },
        { label: 'BASE', value: 'BKK' },
      ],
    },
    '/skills': {
      code: 'SECTOR-02',
      name: 'TECH FORGE',
      brief: 'Toolset arsenal — orthogonal capability matrix.',
      icon: Code2,
      accent: isLight ? 'text-emerald-400' : 'text-emerald-700 dark:text-emerald-300',
      accentBorder: isLight ? 'border-sky-300/40' : 'border-emerald-500/40 dark:border-emerald-400/50',
      stats: [
        { label: 'CATEGORIES', value: String(liveStats.skillsCategoriesCount) },
        { label: 'TECH ITEMS', value: String(liveStats.skillsTotalItems) },
        { label: 'AXES', value: String(liveStats.skillsCategoriesCount) },
        { label: 'STATUS', value: 'LIVE' },
      ],
    },
    '/services': {
      code: 'SECTOR-03',
      name: 'ENERGY HUB',
      brief: 'Deployable capabilities — service monoliths online.',
      icon: Cpu,
      accent: isLight ? 'text-amber-400' : 'text-amber-700 dark:text-amber-300',
      accentBorder: isLight ? 'border-sky-300/40' : 'border-amber-500/40 dark:border-amber-400/50',
      stats: [
        { label: 'MONOLITHS', value: String(liveStats.servicesCount) },
        { label: 'AVAILABILITY', value: 'OPEN' },
        { label: 'MODE', value: 'CONTRACT' },
        { label: 'STATUS', value: 'LIVE' },
      ],
    },
    '/experience': {
      code: 'SECTOR-04',
      name: 'CHRONO-RING',
      brief: 'Mission log — past trajectories on the dial.',
      icon: Clock,
      accent: isLight ? 'text-sky-300' : 'text-sky-700 dark:text-sky-300',
      accentBorder: isLight ? 'border-sky-300/40' : 'border-sky-500/40 dark:border-sky-400/50',
      stats: [
        { label: 'ENTRIES', value: String(liveStats.expCount) },
        { label: 'RANGE', value: liveStats.expRange },
        { label: 'FORMAT', value: 'CHRONO' },
        { label: 'STATUS', value: 'ACTIVE' },
      ],
    },
    '/projects': {
      code: 'SECTOR-05',
      name: 'CONSTELLATION',
      brief: 'Mission archives — linked star projects.',
      icon: FolderGit2,
      accent: isLight ? 'text-rose-400' : 'text-rose-700 dark:text-rose-300',
      accentBorder: isLight ? 'border-sky-300/40' : 'border-rose-500/40 dark:border-rose-400/50',
      stats: [
        { label: 'PROJECTS', value: String(liveStats.projectsCount) },
        { label: 'DEPLOYED', value: String(liveStats.projectsCount) },
        { label: 'IN ORBIT', value: '0' },
        { label: 'ARCHIVED', value: '0' },
      ],
    },
  };

  const sector = SECTORS[pathname] ?? SECTORS['/'];
  const Icon = sector.icon;

  if (pathname.startsWith('/admin')) return null;

  return (
    <AnimatePresence>
      {isSystemBooted && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
          className="fixed left-6 top-6 z-40 pointer-events-none"
        >
          <div className="flex items-start gap-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={`pointer-events-auto w-70 backdrop-blur-md border rounded-sm overflow-hidden transition-all duration-300 ${
                isLight
                  ? 'bg-white/10 border-sky-300/40 text-sky-300 shadow-md shadow-sky-950/40'
                  : `bg-black/55 ${sector.accentBorder} shadow-lg shadow-black/50 dark:shadow-[0_0_20px_rgba(34,211,238,0.08)]`
              }`}
            >
              {/* Header strip - โชว์ตลอดเวลา */}
              <div className={`flex items-center gap-3 px-4 py-2.5 border-b ${
                isLight ? 'border-sky-300/20 bg-white/5' : 'border-b border-slate-300/40 dark:border-white/10 bg-slate-50/50 dark:bg-white/3'
              }`}>
                <div className={`w-2 h-2 rounded-full bg-current ${sector.accent} animate-pulse`} />
                <Icon size={14} className={sector.accent} />
                <span className={`font-mono text-[10px] tracking-[0.25em] ${sector.accent}`}>
                  {sector.code}
                </span>
                <span className={`ml-auto font-mono text-[9px] tracking-widest ${isLight ? 'text-sky-400/70' : 'text-slate-500 dark:text-gray-500'}`}>
                  LIVE
                </span>
              </div>

              {/* 🌟 ห่อเนื้อหาส่วนที่ย่อได้ด้วย AnimatePresence เพื่อทำความสูงแบบ Auto */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    key="hud-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {/* Title + brief */}
                    <div className={`px-4 py-3 border-b ${isLight ? 'border-sky-300/20' : 'border-slate-300/40 dark:border-white/10'}`}>
                      <h2 className={`font-mono text-base tracking-[0.2em] ${sector.accent}`}>
                        {sector.name}
                      </h2>
                      <p className={`mt-1 text-[11px] leading-relaxed font-sans ${isLight ? 'text-sky-200/80' : 'text-slate-600 dark:text-gray-400'}`}>
                        {sector.brief}
                      </p>
                    </div>

                    {/* Stat grid */}
                    <div className="grid grid-cols-2">
                      {sector.stats.map((stat, i) => (
                        <div
                          key={stat.label}
                          className={`px-4 py-2.5 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b' : ''} ${
                            isLight ? 'border-sky-300/20' : 'border-slate-300/40 dark:border-white/5'
                          }`}
                        >
                          <p className={`font-mono text-[9px] tracking-[0.2em] mb-0.5 ${isLight ? 'text-sky-400/60' : 'text-slate-500 dark:text-gray-500'}`}>
                            {stat.label}
                          </p>
                          <p className={`font-mono text-xs tracking-wider ${sector.accent}`}>
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 🌟 ปุ่มสลับลูกศร */}
              <div
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`flex items-center justify-center py-1.5 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-sky-300/10' : 'hover:bg-white/5'
                }`}
              >
                {isCollapsed ? (
                  <ChevronDown size={14} className={`${sector.accent} opacity-70`} />
                ) : (
                  <ChevronUp size={14} className={`${sector.accent} opacity-70`} />
                )}
              </div>

              {/* Footer scanline */}
              <div className={`h-px bg-linear-to-r from-transparent via-current to-transparent opacity-30 ${sector.accent}`} />
            </motion.div>
          </AnimatePresence>

          {/* Admin access button — circular, fixed top-right, hidden on admin routes */}
          {!pathname.startsWith('/admin') && (
            <Link
              href="/admin"
              title="Admin Access"
              className={`fixed top-4 right-4 z-300 w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-md transition-all pointer-events-auto ${
                isLight
                  ? 'bg-white/70 border-purple-400/40 text-purple-500 hover:bg-purple-100 hover:border-purple-500/70 shadow-[0_4px_20px_rgba(168,85,247,0.15)]'
                  : 'bg-black/60 border-purple-500/40 text-purple-400 hover:bg-purple-500/15 hover:border-purple-300/70 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
              }`}
            >
              <ShieldCheck size={16} />
            </Link>
          )}

          {/* Active explorers counter */}
          <div className={`pointer-events-auto flex items-center gap-2 px-3 py-2 backdrop-blur-md border rounded-sm font-mono text-[9px] tracking-[0.2em] uppercase select-none whitespace-nowrap ${
            isLight
              ? 'bg-white/5 border-sky-300/30 text-sky-400/70 shadow-md shadow-sky-950/40'
              : 'bg-black/40 border-cyan-500/20 text-cyan-500/60 shadow-lg shadow-black/50'
          }`}>
            <Users size={11} className={isLight ? 'text-sky-400' : 'text-cyan-400'} />
            <span>EXPLORERS</span>
            <span className={`font-bold tabular-nums ${isLight ? 'text-sky-300' : 'text-cyan-300'}`}>
              [{activeExplorerCount}]
            </span>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${
              activeExplorerCount > 1
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                : (isLight ? 'bg-sky-400/50' : 'bg-cyan-600/50')
            }`} />
          </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}