'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useThemeStore } from '@/lib/store/useThemeStore';
import { 
  FolderGit2, Code2, Cpu, Clock, Terminal, Activity, 
  ArrowUpRight, ShieldCheck, Server, User 
} from 'lucide-react';

export default function AdminDashboard() {
  const theme = useThemeStore((s: any) => s.theme);
  const isLight = theme === 'light';

  // 📡 State สำหรับเก็บยอด Telemetry จริงจาก Database
  const [telemetry, setTelemetry] = useState({
    projectsCount: 0,
    skillsCount: 0,
    servicesCount: 0,
    experienceCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // 📡 ยิงสัญญาณดึงค่าสถิติจริงพร้อมกันทั้งระบบ
  useEffect(() => {
    const fetchSystemTelemetry = async () => {
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

        let sCount = 0;
        if (skillsRes?.ok) {
          const sData = await skillsRes.json();
          const core = sData?.skills || {};
          sCount = Object.values(core).reduce((acc: number, arr: any) => acc + (arr?.length || 0), 0);
        }

        let svcCount = 0;
        if (svcsRes?.ok) {
          const svcData = await svcsRes.json();
          svcCount = svcData?.services?.length || 0;
        }

        let eCount = 0;
        if (expRes?.ok) {
          const eData = await expRes.json();
          eCount = eData?.experiences?.length || 0;
        }

        setTelemetry({
          projectsCount: pCount,
          skillsCount: sCount,
          servicesCount: svcCount,
          experienceCount: eCount,
        });
      } catch (error) {
        console.error('[ DASHBOARD TELEMETRY ERROR ]', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSystemTelemetry();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center font-mono tracking-widest text-sky-400 dark:text-cyan-400 animate-pulse">
        <Server className="animate-spin mb-4" size={32} />
        GATHERING CORE CORE METRICS...
      </div>
    );
  }

  // ข้อมูลของแต่ละการ์ดวิเคราะห์สถานะระบบ (Sector Diagnostics)
  const diagnostics = [
    { name: 'Identity Info', path: '/admin/aboutme', count: 'SYNCED', desc: 'Personal biography and multi-slideshow profiles.', icon: User, color: 'text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-500/5' },
    { name: 'Tech Forge', path: '/admin/skills', count: `${telemetry.skillsCount} NODES`, desc: 'Arsenal matrices encompassing software stack registries.', icon: Code2, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { name: 'Energy Hub', path: '/admin/services', count: `${telemetry.servicesCount} STREAMS`, desc: 'Deployable system monolith solutions online.', icon: Cpu, color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
    { name: 'Chrono-Ring', path: '/admin/experience', count: `${telemetry.experienceCount} LOGS`, desc: 'Professional trajectory history milestone trackers.', icon: Clock, color: 'text-sky-400 border-sky-500/20 bg-sky-500/5' },
    { name: 'Constellation', path: '/admin/projects', count: `${telemetry.projectsCount} STELLAR`, desc: 'Dynamic project blocks and live portfolio case studies.', icon: FolderGit2, color: 'text-rose-400 border-rose-500/20 bg-rose-500/5' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
      
      {/* ================= COMPONENT 1: CORE HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-400/30 dark:border-cyan-500/30 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-sky-100 dark:text-white flex items-center gap-3">
            <Activity className="text-sky-400 dark:text-cyan-400 animate-pulse" size={28} />
            Command Telemetry Deck
          </h1>
          <p className="text-xs text-sky-400 dark:text-cyan-500 tracking-widest mt-2">[ SYSTEM ROOT MONITORING PLATFORM ]</p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2 border rounded-sm bg-white/5 border-sky-300/20 text-sky-300 font-mono text-xs shadow-md shadow-sky-950/20 dark:border-cyan-500/20 dark:text-cyan-400 dark:shadow-none">
          <ShieldCheck size={14} className="text-emerald-400 animate-bounce" />
          <span>SECURITY PROTOCOLS: ACTIVE</span>
        </div>
      </div>

      {/* ================= COMPONENT 2: METRICS GRID ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'CONSTELLATION PROJECTS', val: telemetry.projectsCount, icon: FolderGit2, clr: 'text-rose-400' },
          { label: 'TOTAL SKILL NODES', val: telemetry.skillsCount, icon: Code2, clr: 'text-emerald-400' },
          { label: 'ACTIVE SERVICES', val: telemetry.servicesCount, icon: Cpu, clr: 'text-amber-400' },
          { label: 'CHRONO RECORDS', val: telemetry.experienceCount, icon: Clock, clr: 'text-sky-400' },
        ].map((m, idx) => (
          <div key={idx} className="p-5 border rounded-sm backdrop-blur-md bg-white/5 border-sky-300/20 dark:bg-black/40 dark:border-white/10 flex items-center justify-between group hover:border-sky-400 dark:hover:border-cyan-500 transition-colors">
            <div className="space-y-1">
              <p className="text-[9px] font-mono tracking-widest text-sky-300/60 dark:text-gray-500 uppercase">{m.label}</p>
              <p className={`text-2xl font-mono font-bold ${m.clr}`}>{m.val}</p>
            </div>
            <m.icon size={24} className={`${m.clr} opacity-40 group-hover:opacity-100 transition-opacity`} />
          </div>
        ))}
      </div>

      {/* ================= COMPONENT 3: SECTOR CONFIGURATION ================= */}
      <div className="space-y-4">
        <h3 className="font-mono text-xs text-sky-300/60 dark:text-gray-400 tracking-widest uppercase flex items-center gap-2">
          <Terminal size={14} className="text-sky-400 dark:text-cyan-400" /> SYSTEM SECTOR DIAGNOSTICS
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {diagnostics.map((diag, index) => (
            <Link key={index} href={diag.path}>
              <div className="border p-5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer transition-all backdrop-blur-md bg-white/5 border-sky-300/20 hover:border-sky-400 dark:bg-black/40 dark:border-white/10 dark:hover:border-cyan-500/50">
                <div className="flex items-start sm:items-center gap-4 flex-1">
                  <div className={`p-2.5 rounded-sm border ${diag.color} shrink-0`}>
                    <diag.icon size={18} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-md text-white font-serif flex items-center gap-2 group-hover:text-sky-300 dark:group-hover:text-cyan-300 transition-colors">
                      {diag.name}
                    </h4>
                    <p className={`text-xs ${isLight ? 'text-sky-200/70' : 'text-gray-400'} line-clamp-1`}>
                      {diag.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t pt-3 sm:pt-0 sm:border-t-0 border-sky-300/10 dark:border-white/5 shrink-0">
                  <span className="font-mono text-xs px-2.5 py-1 rounded-sm bg-white/5 border border-sky-300/10 text-sky-300 dark:text-gray-400">
                    {diag.count}
                  </span>
                  <div className="p-1.5 rounded-sm border border-sky-300/10 text-sky-300/40 group-hover:text-sky-300 group-hover:border-sky-400 dark:text-gray-600 dark:group-hover:text-cyan-400 dark:group-hover:border-cyan-500 transition-all">
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}