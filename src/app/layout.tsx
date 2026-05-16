import './globals.css';
import { Space_Grotesk, JetBrains_Mono, Cinzel } from 'next/font/google';

// 👇 1. ลบ import dynamic ทิ้งไป และใช้ Import แบบปกติตัวเดียวจบ
import SceneCanvas from '@/components/3d/SceneCanvas';
import RadarHud from '@/components/ui/RadarHud';
import SectorHud from '@/components/ui/SectorHud';
import DataSlate from '@/components/ui/DataSlate';

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
  title: 'Monthol Sukjinda | Cosmic Portfolio',
  description: 'Interactive 3D Portfolio of a Full-Stack Developer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} ${cinzel.variable} antialiased`}>
      <body className="bg-black text-white overflow-hidden font-sans">
        
        {/* โหลดโลก 3D ตามปกติ (เพราะเราจัดการเรื่อง Texture ไปแล้ว) */}
        <SceneCanvas />
        
        <main className="relative z-10 w-full h-screen pointer-events-none">
          {children}
        </main>
        
        <SectorHud />
        <RadarHud />
        <DataSlate />
      </body>
    </html>
  );
}