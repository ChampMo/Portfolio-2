// ไฟล์: src/components/ui/SectorHud.tsx
// 🛰️ Persistent left-side HUD that mirrors the current pathname as a "sector
// readout". Pulls live counts/derived stats from the mock modules so the panel
// always reflects the real data — edit a mock file and the readout updates.
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import {
  Hexagon,
  Code2,
  Cpu,
  Clock,
  FolderGit2,
  Orbit,
  type LucideIcon,
} from 'lucide-react';
import { profileData } from '@/lib/mock/profile';
import { skillsData } from '@/lib/mock/skills';
import { servicesData } from '@/lib/mock/services';
import { experienceData } from '@/lib/mock/experience';
import { projectsData } from '@/lib/mock/projects';

type Stat = { label: string; value: string };

type Sector = {
  code: string;
  name: string;
  brief: string;
  icon: LucideIcon;
  accent: string;       // tailwind text color class
  accentBorder: string; // tailwind border color class
  stats: Stat[];
};

// 📊 Derived totals — recomputed at module load so they always match the data
const totalSkillItems = skillsData.categories.reduce(
  (sum, c) => sum + c.items.length,
  0,
);

const projectStatusCounts = projectsData.projects.reduce<Record<string, number>>(
  (acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  },
  {},
);

const allEntryYears = experienceData.entries
  .map((e) => e.time.match(/\d{4}/g) ?? [])
  .flat()
  .map(Number);
const earliestYear = allEntryYears.length ? Math.min(...allEntryYears) : null;
const latestYear = allEntryYears.length ? Math.max(...allEntryYears) : null;
const experienceRange =
  earliestYear && latestYear
    ? earliestYear === latestYear
      ? `${earliestYear}`
      : `${earliestYear}–${latestYear}`
    : '—';

// 🗂️ One sector definition per route. Falls back to OVERVIEW for unknown paths.
const SECTORS: Record<string, Sector> = {
  '/': {
    code: 'SECTOR-00',
    name: 'COSMIC OVERVIEW',
    brief: 'Full system view — all orbital bodies in motion.',
    icon: Orbit,
    accent: 'text-cyan-300',
    accentBorder: 'border-cyan-400/50',
    stats: [
      { label: 'PLANETS', value: '4' },
      { label: 'CORE', value: '1' },
      { label: 'PROJECTS', value: String(projectsData.projects.length) },
      { label: 'SKILLS', value: String(totalSkillItems) },
    ],
  },
  '/about': {
    code: 'SECTOR-01',
    name: 'IDENTITY CORE',
    brief: 'Operator profile and origin telemetry.',
    icon: Hexagon,
    accent: 'text-fuchsia-300',
    accentBorder: 'border-fuchsia-400/50',
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
    accent: 'text-emerald-300',
    accentBorder: 'border-emerald-400/50',
    stats: [
      { label: 'CATEGORIES', value: String(skillsData.categories.length) },
      { label: 'TECH ITEMS', value: String(totalSkillItems) },
      { label: 'AXES', value: String(skillsData.categories.length) },
      { label: 'STATUS', value: 'LIVE' },
    ],
  },
  '/services': {
    code: 'SECTOR-03',
    name: 'ENERGY HUB',
    brief: 'Deployable capabilities — service monoliths online.',
    icon: Cpu,
    accent: 'text-amber-300',
    accentBorder: 'border-amber-400/50',
    stats: [
      { label: 'MONOLITHS', value: String(servicesData.services.length) },
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
    accent: 'text-sky-300',
    accentBorder: 'border-sky-400/50',
    stats: [
      { label: 'ENTRIES', value: String(experienceData.entries.length) },
      { label: 'RANGE', value: experienceRange },
      { label: 'TYPES', value: String(new Set(experienceData.entries.map((e) => e.type)).size) },
      { label: 'STATUS', value: 'ARCHIVED' },
    ],
  },
  '/projects': {
    code: 'SECTOR-05',
    name: 'CONSTELLATION',
    brief: 'Mission archives — linked star projects.',
    icon: FolderGit2,
    accent: 'text-rose-300',
    accentBorder: 'border-rose-400/50',
    stats: [
      { label: 'PROJECTS', value: String(projectsData.projects.length) },
      { label: 'DEPLOYED', value: String(projectStatusCounts.DEPLOYED ?? 0) },
      { label: 'IN ORBIT', value: String(projectStatusCounts.IN_ORBIT ?? 0) },
      { label: 'ARCHIVED', value: String(projectStatusCounts.ARCHIVED ?? 0) },
    ],
  },
};

const FALLBACK_SECTOR = SECTORS['/'];

export default function SectorHud() {
  const isSystemBooted = useAppStore((s) => s.isSystemBooted);
  const pathname = usePathname() ?? '/';
  const sector = SECTORS[pathname] ?? FALLBACK_SECTOR;
  const Icon = sector.icon;

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
          {/* Re-key on pathname so each sector animates in fresh */}
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={`pointer-events-auto w-70 bg-black/55 backdrop-blur-md border ${sector.accentBorder} rounded-sm shadow-[0_0_20px_rgba(34,211,238,0.08)] overflow-hidden`}
            >
              {/* Header strip */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 bg-white/3">
                <div className={`w-2 h-2 rounded-full bg-current ${sector.accent} animate-pulse`} />
                <Icon size={14} className={sector.accent} />
                <span className={`font-mono text-[10px] tracking-[0.25em] ${sector.accent}`}>
                  {sector.code}
                </span>
                <span className="ml-auto font-mono text-[9px] tracking-widest text-gray-500">
                  LIVE
                </span>
              </div>

              {/* Title + brief */}
              <div className="px-4 py-3 border-b border-white/10">
                <h2 className={`font-mono text-base tracking-[0.2em] ${sector.accent}`}>
                  {sector.name}
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-400 font-sans">
                  {sector.brief}
                </p>
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-2">
                {sector.stats.map((stat, i) => (
                  <div
                    key={stat.label}
                    className={`px-4 py-2.5 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b' : ''} border-white/5`}
                  >
                    <p className="font-mono text-[9px] tracking-[0.2em] text-gray-500 mb-0.5">
                      {stat.label}
                    </p>
                    <p className={`font-mono text-xs tracking-wider ${sector.accent}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer scanline */}
              <div className={`h-px bg-linear-to-r from-transparent via-current to-transparent opacity-30 ${sector.accent}`} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
