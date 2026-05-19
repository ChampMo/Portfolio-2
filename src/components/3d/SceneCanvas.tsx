'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, Fragment, useEffect, useState } from 'react';
import { Stars, Sparkles, Torus } from '@react-three/drei';
import * as THREE from 'three';
import CrystalCore from './CrystalCore';
import CameraRig from './CameraRig';
import Planet from './Planet';
import TechForgePlanet from './TechForgePlanet';
import EnergyHubPlanet from './EnergyHubPlanet';
import ChronoRingPlanet from './ChronoRingPlanet';
import ConstellationPlanet from './ConstellationPlanet';
import MultiplayerShip from './MultiplayerShip';
import { useAppStore } from '@/lib/store/useAppStore';
import { useThemeStore } from '@/lib/store/useThemeStore';
import { useMultiplayer, type RemotePlayer } from '@/lib/hooks/useMultiplayer';

const CONFIG_PLANETS = {
  skills:     { radiusX: 12, radiusZ: 12, speed: 0.09, offset: 0,                  centerY: 1.0,  color: "#10b981", label: "[ TECH FORGE ]",     scale: 1.8 },
  services:   { radiusX: 17, radiusZ: 17, speed: 0.06, offset: Math.PI / 2,        centerY: 0.5,  color: "#f59e0b", label: "[ ENERGY HUB ]",     scale: 1.8 },
  experience: { radiusX: 22, radiusZ: 22, speed: 0.045, offset: Math.PI,           centerY: -0.5, color: "#3b82f6", label: "[ CHRONO-RING ]",    scale: 1.5 },
  projects:   { radiusX: 27, radiusZ: 27, speed: 0.03,  offset: (3 * Math.PI) / 2, centerY: 1.5,  color: "#ec4899", label: "[ CONSTELLATION ]", scale: 2.0 },
};

const DESIGN_VIEWPORT_WIDTH = 1600;
const MIN_ORBIT_SCALE = 0.55;
const MAX_ORBIT_SCALE = 1.15;

type PlanetCfg = (typeof CONFIG_PLANETS)[keyof typeof CONFIG_PLANETS] & { path: string };

function MultiplayerShips({ players }: { players: RemotePlayer[] }) {
  return (
    <>
      {players.map((player, index) => (
        <MultiplayerShip
          key={player.sessionId}
          callsign={player.callsign}
          planet={player.planet}
          shipIndex={index}
          colorIndex={player.colorIndex ?? 0}
        />
      ))}
    </>
  );
}

// Pre-compiles the most expensive WebGL shaders during the TerminalIntro so
// the first frame after launch is stutter-free.  The group sits at y=-2000
// (far below the scene), renders for one effect cycle, then unmounts.
function AssetWarmup() {
  const { gl, scene, camera } = useThree();
  const [done, setDone] = useState(false);

  useEffect(() => {
    gl.compile(scene, camera);
    setDone(true);
  // gl/scene/camera are stable refs — exhaustive-deps would cause infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;

  return (
    <group position={[0, -2000, 0]}>
      {/* MeshPhysicalMaterial — ship hull & accent */}
      <mesh>
        <boxGeometry args={[0.01, 0.01, 0.01]} />
        <meshPhysicalMaterial clearcoat={1} metalness={0.96} roughness={0.18} color="#0b0f1a" />
      </mesh>
      {/* MeshStandardMaterial — thrusters & emissive elements */}
      <mesh>
        <sphereGeometry args={[0.01, 8, 6]} />
        <meshStandardMaterial emissive="#22d3ee" emissiveIntensity={10} roughness={0} />
      </mesh>
      {/* MeshBasicMaterial additive — halo bloom spheres */}
      <mesh>
        <sphereGeometry args={[0.01, 8, 6]} />
        <meshBasicMaterial
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          color="#22d3ee"
          opacity={0.2}
        />
      </mesh>
    </group>
  );
}

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
                scale: planet.scale,
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
  const { remotePlayers } = useMultiplayer();

  const [sectorTitles, setSectorTitles] = useState({
    skills:     CONFIG_PLANETS.skills.label,
    services:   CONFIG_PLANETS.services.label,
    experience: CONFIG_PLANETS.experience.label,
    projects:   CONFIG_PLANETS.projects.label,
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/skills').then(r => r.ok ? r.json() : null),
      fetch('/api/services').then(r => r.ok ? r.json() : null),
      fetch('/api/experience').then(r => r.ok ? r.json() : null),
      fetch('/api/projects/meta').then(r => r.ok ? r.json() : null),
    ]).then(([skills, services, exp, proj]) => {
      setSectorTitles({
        skills:     skills?.sectorData?.title     || CONFIG_PLANETS.skills.label,
        services:   services?.sectorData?.title   || CONFIG_PLANETS.services.label,
        experience: exp?.sectorData?.title        || CONFIG_PLANETS.experience.label,
        projects:   proj?.sectorData?.title       || CONFIG_PLANETS.projects.label,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const rootElement = document.documentElement;
    if (theme === 'dark') {
      rootElement.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
    }
  }, [theme]);

  const planets: PlanetCfg[] = [
    { ...CONFIG_PLANETS.skills,     label: sectorTitles.skills,     path: "/skills" },
    { ...CONFIG_PLANETS.services,   label: sectorTitles.services,   path: "/services" },
    { ...CONFIG_PLANETS.experience, label: sectorTitles.experience, path: "/experience" },
    { ...CONFIG_PLANETS.projects,   label: sectorTitles.projects,   path: "/projects" },
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
        <ambientLight intensity={1.8} />
        <pointLight position={[0, 0, 0]} intensity={4} distance={60} color="#ffffff" />

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
        
        {isLight ? (
          <>
            {/* ดาวพื้นหลังสำหรับธีมสว่าง: สองชั้น ให้ความสว่างต่างกัน */}
            <Stars radius={100} depth={50} count={3500} factor={7} saturation={0.4} fade speed={0.8} />
            <Stars radius={80} depth={30} count={800} factor={12} saturation={0.2} fade speed={1.3} />
            {/* ฟุ้งเรืองแสงรอบดาวบางดวง */}
            <Sparkles position={[0, 5, -25]} count={60} scale={[120, 90, 25]} size={5} speed={0.15} opacity={0.55} color="#ffffff" />
            <Sparkles position={[10, -5, -20]} count={35} scale={[80, 60, 15]} size={9} speed={0.08} opacity={0.35} color="#e0eeff" />
            <Sparkles position={[-15, 8, -30]} count={25} scale={[70, 50, 10]} size={12} speed={0.05} opacity={0.25} color="#ffd6ff" />
            <Sparkles position={[0, 0, -30]} count={120} scale={[100, 80, 20]} size={2} speed={0.4} opacity={0.4} color="#22d3ee" />
          </>
        ) : (
          <>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Sparkles position={[0, 0, -30]} count={150} scale={[100, 80, 20]} size={2} speed={0.4} opacity={0.3} color="#22d3ee" />
          </>
        )}

        <AssetWarmup />
        <CameraRig />

        {isSystemBooted && (
          <Suspense fallback={null}>
            <CrystalCore />
            <OrbitalSystem planets={planets} />
            <MultiplayerShips players={remotePlayers} />
          </Suspense>
        )}
      </Canvas>
    </div>
  );
}