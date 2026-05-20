import './globals.css';
import { Space_Grotesk, JetBrains_Mono, Cinzel } from 'next/font/google';

import SceneCanvas from '@/components/3d/SceneCanvas';
import RadarHud from '@/components/ui/RadarHud';
import SectorHud from '@/components/ui/SectorHud';
import DataSlate from '@/components/ui/DataSlate';
import ThemeToggle from '@/components/ui/ThemeToggle';
import VolumeControl from '@/components/ui/VolumeControl';
import SoundManagerInit from '@/components/ui/SoundManagerInit';
import MobileMenu from '@/components/ui/MobileMenu'; // 🌟 1. นำเข้าโมดูลเมนูโมบายล์ตัวใหม่

const themeNoFlashScript = `
(function(){try{
  var t=localStorage.getItem('cv-theme');
  if(t!=='light'){document.documentElement.classList.add('dark');}
}catch(e){document.documentElement.classList.add('dark');}})();
`;

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const jetBrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

const cinzel = Cinzel({ 
  subsets: ['latin'],
  variable: '--font-cinzel',
});

export const metadata = {
  title: 'Monthol Sukjinda | Portfolio',
  description: 'Interactive 3D Portfolio of a Full-Stack Developer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} ${cinzel.variable} antialiased`} 
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body className="overflow-hidden font-sans">
        
        {/* Global background 3D Scene Layer (Fixed, z-0) */}
        <div className="fixed inset-0 z-0 pointer-events-auto">
          <SceneCanvas />
        </div>

        {/* Page Content Layer (Relative, z-10) */}
        <main className="relative z-10 w-full h-full overflow-y-auto custom-scrollbar">
          {children}
        </main>

        {/* 🌟 2. STAGE MANAGEMENT: คุมคิวอุปกรณ์การแสดงผลแยก Desktop และ Mobile */}
        
        {/* SectorHud แสดงทุกขนาดหน้าจอ */}
        <SectorHud />

        {/* หน้าจอระดับ DESKTOP (ขนาด md ขึ้นไป): แสดงแผงผังเรดาร์และปุ่มเปลี่ยนธีมดั้งเดิม */}
        <div className="hidden md:block">
          <RadarHud />
          <ThemeToggle />
          <VolumeControl />
        </div>

        {/* หน้าจอมือถือ MOBILE (ต่ำกว่าขนาด md ลงไป): พับเก็บทุกอย่างแล้วรันเมนูแฮมเบอร์เกอร์ */}
        <div className="block md:hidden">
          <MobileMenu />
        </div>

        {/* หน้าต่างแสดงประวัติแกนกลาง (เปิดคู่วัตถุ 3D ได้ทุกขนาดหน้าจอ) */}
        <div className="fixed inset-x-0 top-0 bottom-0 pointer-events-none z-40 flex items-center justify-center">
          <DataSlate />
        </div>

        {/* Global audio manager — renders nothing, handles BGM + volume sync */}
        <SoundManagerInit />

      </body>
    </html>
  );
}