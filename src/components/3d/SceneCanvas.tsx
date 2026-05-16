'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, Fragment } from 'react';
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

// 🛰️ Orbital config (BASELINE values — designed for a ~1600px viewport).
// At runtime these radii are scaled by viewport width so the system always fits.
//   x = cos(t · speed + offset) · radiusX
//   z = sin(t · speed + offset) · radiusZ
// Speeds are intentionally slow — the galaxy should feel heavy and majestic.
const CONFIG_PLANETS = {
  skills: {
    radiusX: 12,
    radiusZ: 12,
    speed: 0.09,
    offset: 0,
    centerY: 1.0,
    color: "#10b981",
    label: "[ TECH FORGE ]",
  },
  services: {
    radiusX: 17,
    radiusZ: 17,
    speed: 0.06,
    offset: Math.PI / 2,
    centerY: 0.5,
    color: "#f59e0b",
    label: "[ ENERGY HUB ]",
  },
  experience: {
    radiusX: 22,
    radiusZ: 22,
    speed: 0.045,
    offset: Math.PI,
    centerY: -0.5,
    color: "#3b82f6",
    label: "[ CHRONO-RING ]",
  },
  projects: {
    radiusX: 27,
    radiusZ: 27,
    speed: 0.03,
    offset: (3 * Math.PI) / 2,
    centerY: 1.5,
    color: "#ec4899",
    label: "[ CONSTELLATION ]",
  },
};

// Design baseline width — above this we cap so ultrawides don't balloon the orbits.
const DESIGN_VIEWPORT_WIDTH = 1600;
const MIN_ORBIT_SCALE = 0.55;
const MAX_ORBIT_SCALE = 1.15;

type PlanetCfg = (typeof CONFIG_PLANETS)[keyof typeof CONFIG_PLANETS] & { path: string };

// 🪐 Inner system that needs the R3F context (useThree) to read viewport pixels.
function OrbitalSystem({ planets }: { planets: PlanetCfg[] }) {
  const { size } = useThree();
  // Scale primarily off viewport WIDTH so the largest orbit always fits horizontally.
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
            {/* 1. Orbit guideline — horizontal Torus aligned with the planet's orbital plane */}
            <Torus
              args={[ringRadius, 0.015, 16, 128]}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, planet.centerY, 0]}
            >
              <meshBasicMaterial color={planet.color} transparent opacity={0.18} />
            </Torus>

            {/* 2. ดาวเคราะห์ — รองรับ custom variant ต่อ path */}
            {(() => {
              const shared = {
                radiusX: rx,
                radiusZ: rz,
                speed: planet.speed,
                offset: planet.offset,
                centerY: planet.centerY,
                color: planet.color,
                label: planet.label,
                path: planet.path,
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

  // สร้างกลุ่มดาวและจัดวางในผังวงโคจร
  const planets: PlanetCfg[] = [
    { ...CONFIG_PLANETS.skills, path: "/skills" },
    { ...CONFIG_PLANETS.services, path: "/services" },
    { ...CONFIG_PLANETS.experience, path: "/experience" },
    { ...CONFIG_PLANETS.projects, path: "/projects" },
  ];

  return (
    <div className="fixed inset-0 z-0 bg-black pointer-events-auto">
      <Canvas
        camera={{ position: [0, 16, 32], fov: 45 }} // มุมสูงและเฉียง
        gl={{ antialias: true, alpha: false }}
      >
        {/* สภาพแวดล้อมและแสง */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 10]} intensity={2} color="#c084fc" />
        <directionalLight position={[-10, -10, -10]} intensity={1} color="#22d3ee" />
        <Environment preset="city" />

        {/* อวกาศ */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={200} scale={20} size={1.5} speed={0.4} opacity={0.3} color="#22d3ee" />

        {/* กล้องขับเคลื่อน */}
        <CameraRig />

        {/* ================= วัตถุหลักในจักรวาล ================= */}
        {isSystemBooted && (
          <Suspense fallback={null}>
            {/* 👤 ตรงกลาง: พอร์ตเทรตโฮโลแกรม (พิกัดศูนย์กลาง [0, 0, 0]) */}
            <CrystalCore />

            {/* 👇 ระบบวงโคจร — รัศมีสเกลตาม viewport width ผ่าน useThree() */}
            <OrbitalSystem planets={planets} />

          </Suspense>
        )}
      </Canvas>
    </div>
  );
}