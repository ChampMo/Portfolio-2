'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, Fragment, useEffect } from 'react'; 
import { Stars, Sparkles, Environment, Torus } from '@react-three/drei';
import * as THREE from 'three';
import CrystalCore from './CrystalCore';
import CameraRig from './CameraRig';
import Planet from './Planet';
import TechForgePlanet from './TechForgePlanet';
import EnergyHubPlanet from './EnergyHubPlanet';
import ChronoRingPlanet from './ChronoRingPlanet';
import ConstellationPlanet from './ConstellationPlanet';
import { useAppStore } from '@/lib/store/useAppStore';
import { useThemeStore } from '@/lib/store/useThemeStore';

const CONFIG_PLANETS = {
  skills: { radiusX: 12, radiusZ: 12, speed: 0.09, offset: 0, centerY: 1.0, color: "#10b981", label: "[ TECH FORGE ]" },
  services: { radiusX: 17, radiusZ: 17, speed: 0.06, offset: Math.PI / 2, centerY: 0.5, color: "#f59e0b", label: "[ ENERGY HUB ]" },
  experience: { radiusX: 22, radiusZ: 22, speed: 0.045, offset: Math.PI, centerY: -0.5, color: "#3b82f6", label: "[ CHRONO-RING ]" },
  projects: { radiusX: 27, radiusZ: 27, speed: 0.03, offset: (3 * Math.PI) / 2, centerY: 1.5, color: "#ec4899", label: "[ CONSTELLATION ]" },
};

const DESIGN_VIEWPORT_WIDTH = 1600;
const MIN_ORBIT_SCALE = 0.55;
const MAX_ORBIT_SCALE = 1.15;

type PlanetCfg = (typeof CONFIG_PLANETS)[keyof typeof CONFIG_PLANETS] & { path: string };

function OrbitalSystem({ planets }: { planets: PlanetCfg[] }) {
  const { size } = useThree();
  const scale = THREE.MathUtils.clamp(
    size.width / DESIGN_VIEWPORT_WIDTH,
    MIN_ORBIT_SCALE,
    MAX_ORBIT_SCALE,
  );

  return (
    <>
      {planets.map((planet, index) => {
        const rx = planet.radiusX * scale;
        const rz = planet.radiusZ * scale;
        const ringRadius = (rx + rz) / 2;
        return (
          <Fragment key={index}>
            <Torus args={[ringRadius, 0.015, 16, 128]} rotation={[Math.PI / 2, 0, 0]} position={[0, planet.centerY, 0]}>
              <meshBasicMaterial color={planet.color} transparent opacity={0.18} />
            </Torus>

            {(() => {
              const shared = {
                radiusX: rx, radiusZ: rz, speed: planet.speed, offset: planet.offset,
                centerY: planet.centerY, color: planet.color, label: planet.label, path: planet.path,
              };
              switch (planet.path) {
                case '/skills':     return <TechForgePlanet {...shared} />;
                case '/services':   return <EnergyHubPlanet {...shared} />;
                case '/experience': return <ChronoRingPlanet {...shared} />;
                case '/projects':   return <ConstellationPlanet {...shared} />;
                default:            return <Planet {...shared} />;
              }
            })()}
          </Fragment>
        );
      })}
    </>
  );
}

export default function SceneCanvas() {
  const isSystemBooted = useAppStore((state) => state.isSystemBooted);
  const theme = useThemeStore((s) => s.theme);

  // 🔌 ฟังก์ชันสะพานไฟ สั่งแอด/ถอดคลาส .dark ไปที่ตัวโครงสร้างเว็บปกติ (เก็บไว้เพื่อให้ UI ข้าวนอกเปลี่ยนตาม)
  useEffect(() => {
    const rootElement = document.documentElement;
    if (theme === 'dark') {
      rootElement.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
    }
  }, [theme]);

  const planets: PlanetCfg[] = [
    { ...CONFIG_PLANETS.skills, path: "/skills" },
    { ...CONFIG_PLANETS.services, path: "/services" },
    { ...CONFIG_PLANETS.experience, path: "/experience" },
    { ...CONFIG_PLANETS.projects, path: "/projects" },
  ];
  const isLight = theme === 'light';

  // 🌌 [STRICT DARK] ล็อกค่าห้วงอวกาศลึกถาวร ไม่ต้องเช็คเงื่อนไขสีสว่าง
  const sceneBg = isLight ? '#010810' : '#050505';
  const fogColor = '#020617';
  const fogNear = 30;
  const fogFar = 100;

  return (
    <div className="fixed inset-0 z-0 pointer-events-auto">
      <Canvas camera={{ position: [0, 16, 32], fov: 45 }} gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={[sceneBg]} />
        <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

        {/* ☀️ ล็อกระบบแสงเนออนไซไฟของธีมมืดถาวร */}
        <ambientLight intensity={0.2} />
        
        <directionalLight
          position={[15, 10, 5]}
          intensity={2} 
          color="#c084fc"
        />
        
        <directionalLight
          position={[-10, -10, -10]}
          intensity={1}
          color="#22d3ee"
        />
        
        <Environment preset="city" />

        {/* ✨ ล็อกกลุ่มดาวและละอองเนบิวลาสีฟ้าไซไฟถาวร (ไม่มีตัวแดงดักเรื่องคลาสสีแน่นอน) */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Sparkles position={[0, 0, -30]} count={150} scale={[100, 80, 20]} size={2} speed={0.4} opacity={0.3} color="#22d3ee" />

        <CameraRig />

        {isSystemBooted && (
          <Suspense fallback={null}>
            <CrystalCore />
            <OrbitalSystem planets={planets} />
          </Suspense>
        )}
      </Canvas>
    </div>
  );
}