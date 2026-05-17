// ไฟล์: src/components/3d/EnergyHubPlanet.tsx
// ⚡ PLANET 2 — ENERGY HUB (/services)
// • Idle: distorting gas-giant body with electrical storm arcs and stubby
//   monoliths visible around the equator.
// • Focused (pathname === '/services'): the four monoliths RISE outwards (GSAP
//   back.out, staggered), each representing a Service. Hovering a monolith:
//     – tints a planet-local point light to the service's hue
//     – floats a holographic name + tagline above the slab
'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import {
  Text,
  MeshDistortMaterial,
  Torus,
  Sparkles,
  useCursor,
  Billboard,
} from '@react-three/drei';
import * as THREE from 'three';
import { useRouter, usePathname } from 'next/navigation';
import gsap from 'gsap';
import { useOrbitPosition, type OrbitParams } from '@/lib/3d/useOrbitPosition';
import { servicesData, type Service } from '@/lib/mock/services';

// Per-service accent hues — drive the local point light tint and monolith glow.
const SERVICE_HUES = ['#22d3ee', '#a78bfa', '#10b981', '#fb7185'];

interface EnergyHubPlanetProps extends OrbitParams {
  color: string;
  label: string;
}

const PLANET_RADIUS = 1.2;

export default function EnergyHubPlanet({
  color,
  label,
  ...orbit
}: EnergyHubPlanetProps) {
  const groupRef = useOrbitPosition(orbit);
  const router = useRouter();
  const pathname = usePathname();
  const isFocused = pathname === orbit.path;

  const [planetHovered, setPlanetHovered] = useState(false);
  const [hoveredService, setHoveredService] = useState<number | null>(null);
  useCursor(planetHovered || hoveredService !== null);

  const stormGroupRef = useRef<THREE.Group>(null);
  const accentLightRef = useRef<THREE.PointLight>(null);

  // Storm arcs spin fast — surface lightning impression
  useFrame((_, delta) => {
    const g = stormGroupRef.current;
    if (g) {
      g.rotation.y += delta * 0.9;
      g.rotation.x += delta * 0.45;
    }
  });

  // 💡 Tween accent light to the hovered service's hue (or back to ambient amber)
  useEffect(() => {
    const light = accentLightRef.current;
    if (!light) return;
    const targetHex = hoveredService !== null ? SERVICE_HUES[hoveredService] : color;
    const target = new THREE.Color(targetHex);
    gsap.to(light.color, {
      r: target.r,
      g: target.g,
      b: target.b,
      duration: 0.6,
      ease: 'power2.out',
      overwrite: true,
    });
    gsap.to(light, {
      intensity: hoveredService !== null ? 3.6 : 1.2,
      duration: 0.6,
      ease: 'power2.out',
      overwrite: true,
    });
  }, [hoveredService, color]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    router.push(orbit.path);
  };

  return (
    <group ref={groupRef}>
      {/* Generous hitbox so the planet remains clickable at overview distance */}
      <mesh
        visible={false}
        onClick={handleClick}
        onPointerOver={() => setPlanetHovered(true)}
        onPointerOut={() => setPlanetHovered(false)}
      >
        <sphereGeometry args={[2.6, 16, 16]} />
      </mesh>

      {/* 🪐 Gas-giant body */}
      <mesh>
        <sphereGeometry args={[PLANET_RADIUS, 64, 64]} />
        <MeshDistortMaterial
          color={planetHovered ? '#ffb866' : color}
          emissive={color}
          emissiveIntensity={0.35}
          distort={0.45}
          speed={2.5}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* ⚡ Surface electrical storms */}
      <group ref={stormGroupRef}>
        <Torus args={[PLANET_RADIUS + 0.12, 0.018, 12, 96]} rotation={[Math.PI / 3, 0, 0]}>
          <meshBasicMaterial color="#fde68a" transparent opacity={0.85} />
        </Torus>
        <Torus args={[PLANET_RADIUS + 0.16, 0.012, 12, 96]} rotation={[Math.PI / 6, Math.PI / 4, 0]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
        </Torus>
        <Torus args={[PLANET_RADIUS + 0.1, 0.014, 12, 96]} rotation={[Math.PI / 2.5, Math.PI / 2, 0]}>
          <meshBasicMaterial color="#fcd34d" transparent opacity={0.65} />
        </Torus>
      </group>

      {/* Atmospheric particles */}
      <Sparkles count={28} scale={3.6} size={2} speed={0.6} opacity={0.75} color={color} />

      {/* 💡 Planet-local hue light (tints with hovered service) */}
      <pointLight
        ref={accentLightRef}
        position={[0, 0, 0]}
        intensity={1.2}
        distance={9}
        color={color}
      />

      {/* 🗿 Service Monoliths around the equator */}
      {servicesData.services.map((service, i) => {
        const angle = (i / servicesData.services.length) * Math.PI * 2;
        const anchor: [number, number, number] = [
          Math.cos(angle) * PLANET_RADIUS,
          0,
          Math.sin(angle) * PLANET_RADIUS,
        ];
        return (
          <Monolith
            key={service.id}
            service={service}
            staggerIndex={i}
            hue={SERVICE_HUES[i] ?? color}
            anchor={anchor}
            isFocused={isFocused}
            isHovered={hoveredService === i}
            onHover={(h) => setHoveredService(h ? i : null)}
          />
        );
      })}

      {/* Holographic planet label — always faces camera */}
      <Billboard position={[0, 2.4, 0]}>
        <Text
          fontSize={0.36}
          color={planetHovered ? '#ffffff' : color}
          letterSpacing={0.2}
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      </Billboard>
    </group>
  );
}

// ── Monolith ────────────────────────────────────────────────────────────────

interface MonolithProps {
  service: Service;
  staggerIndex: number;
  hue: string;
  anchor: [number, number, number];
  isFocused: boolean;
  isHovered: boolean;
  onHover: (h: boolean) => void;
}

const IDLE_SCALE_Y = 0.28;
const RISEN_SCALE_Y = 1.0;

function Monolith({
  service,
  staggerIndex,
  hue,
  anchor,
  isFocused,
  isHovered,
  onHover,
}: MonolithProps) {
  const groupRef = useRef<THREE.Group>(null);

  // 🚀 Rise / fall the monolith on focus state change
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    gsap.to(g.scale, {
      y: isFocused ? RISEN_SCALE_Y : IDLE_SCALE_Y,
      duration: 1.0,
      ease: isFocused ? 'back.out(1.6)' : 'power2.in',
      delay: isFocused ? staggerIndex * 0.08 : 0,
      overwrite: true,
    });
  }, [isFocused, staggerIndex]);

  return (
    <group ref={groupRef} position={anchor} scale={[1, IDLE_SCALE_Y, 1]}>
      {/* Tall slab — base sits flush with anchor when group.scale.y === 1 */}
      <mesh
        position={[0, 0.9, 0]}
        onClick={(e) => e.stopPropagation()}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
        }}
        onPointerOut={() => onHover(false)}
      >
        <boxGeometry args={[0.3, 1.8, 0.2]} />
        <meshStandardMaterial
          color={isHovered ? '#ffffff' : '#0b1220'}
          emissive={hue}
          emissiveIntensity={isHovered ? 1.5 : 0.55}
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* Cap glow at top of monolith */}
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={hue} />
      </mesh>

      {/* Floating description on hover (only meaningful when focused) — always faces camera */}
      {isHovered && isFocused && (
        <Billboard position={[0, 2.35, 0]}>
          <Text
            position={[0, 0.32, 0]}
            fontSize={0.2}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            maxWidth={3.6}
            outlineWidth={0.005}
            outlineColor="#000000"
          >
            {service.name}
          </Text>
          <Text
            position={[0, 0.0, 0]}
            fontSize={0.15}
            color={hue}
            anchorX="center"
            anchorY="middle"
            maxWidth={3.8}
            outlineWidth={0.004}
            outlineColor="#000000"
          >
            {service.tagline}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
