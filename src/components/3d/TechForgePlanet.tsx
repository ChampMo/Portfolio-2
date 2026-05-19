// ไฟล์: src/components/3d/TechForgePlanet.tsx
// 🛠️ PLANET 1 — TECH FORGE (/skills)
// • Idle: metallic server-rack column orbiting the CrystalCore.
// • Focused (pathname === '/skills'): four orthogonal category rings GSAP-explode
//   outward, each ring carrying its skill items as holographic Text. Hovering a
//   data point draws a proficiency vector line from the ring center.
'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text, Torus, Line, useCursor, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter, usePathname } from 'next/navigation';
import gsap from 'gsap';
import { useOrbitPosition, type OrbitParams } from '@/lib/3d/useOrbitPosition';
import { useAppStore } from '@/lib/store/useAppStore';

// Matches the flat skill groups stored in the Skill Mongoose model
type SkillMatrix = {
  languages: string[];
  database: string[];
  frameworks: string[];
  tools: string[];
};

type SkillCategory = {
  name: string;
  items: string[];
};

interface TechForgePlanetProps extends OrbitParams {
  color: string;
  label: string;
  scale?: number;
}

// One orthogonal-ish orientation per skill category (aligned to the 4 DB skill groups).
const RING_ORIENTATIONS: Array<[number, number, number]> = [
  [0, 0, 0],                           // XY plane — LANGUAGES
  [Math.PI / 2, 0, 0],                 // XZ plane — DATABASE
  [0, 0, Math.PI / 2],                 // YZ plane — FRAMEWORKS
  [Math.PI / 4, Math.PI / 4, 0],       // oblique — TOOLS
];

// Cheap deterministic "proficiency" until skills carry real numbers.
const proficiencyFor = (categoryIdx: number, itemIdx: number) =>
  70 + ((categoryIdx * 5 + itemIdx * 7) % 26); // 70..95

// Map the flat DB SkillMatrix to the ordered category array the rings expect
function toCategories(matrix: SkillMatrix): SkillCategory[] {
  return [
    { name: 'LANGUAGES', items: matrix.languages ?? [] },
    { name: 'DATABASE',  items: matrix.database  ?? [] },
    { name: 'FRAMEWORKS', items: matrix.frameworks ?? [] },
    { name: 'TOOLS',     items: matrix.tools     ?? [] },
  ];
}

export default function TechForgePlanet({
  color,
  label,
  scale,
  ...orbit
}: TechForgePlanetProps) {
  const groupRef = useOrbitPosition(orbit);
  const router = useRouter();
  const pathname = usePathname();
  const isFocused = pathname === orbit.path;

  const setSummaryMode = useAppStore((s) => s.setSummaryMode);
  const [hovered, setHovered] = useState(false);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  useCursor(hovered);

  const coreRef = useRef<THREE.Group>(null);
  const ringsGroupRef = useRef<THREE.Group>(null);

  // Fetch live skill data from the API
  useEffect(() => {
    fetch('/api/skills')
      .then((res) => res.json())
      .then((data) => {
        const matrix: SkillMatrix = data?.skills ?? {
          languages: [],
          database: [],
          frameworks: [],
          tools: [],
        };
        setCategories(toCategories(matrix));
      })
      .catch(() => setCategories([]));
  }, []);

  // Gentle spin on the server-rack core
  useFrame((_, delta) => {
    if (coreRef.current) coreRef.current.rotation.y += delta * 0.3;
  });

  // 🎬 Explode / collapse the category rings whenever focus state flips
  useEffect(() => {
    const g = ringsGroupRef.current;
    if (!g) return;
    const targetScale = isFocused ? 1 : 0.0001;
    gsap.to(g.scale, {
      x: targetScale,
      y: targetScale,
      z: targetScale,
      duration: isFocused ? 1.4 : 0.8,
      ease: isFocused ? 'expo.out' : 'power2.in',
      overwrite: true,
    });
  }, [isFocused]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    router.push(orbit.path);
    setSummaryMode(true);
  };

  return (
    <group ref={groupRef} scale={scale ?? 1}>
      {/* Generous invisible hitbox so the planet stays clickable from far away */}
      <mesh
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        visible={false}
      >
        <sphereGeometry args={[1.8, 16, 16]} />
      </mesh>

      {/* Planet-local glow light */}
      <pointLight position={[0, 0, 0]} intensity={hovered ? 4.0 : 2.0} distance={10} color={color} />

      {/* 🏗️ Central server-rack core */}
      <group ref={coreRef}>
        <mesh>
          <cylinderGeometry args={[0.35, 0.35, 1.8, 24]} />
          <meshStandardMaterial
            color={color}
            metalness={0.85}
            roughness={0.25}
            emissive={color}
            emissiveIntensity={hovered ? 2.5 : 1.6}
          />
        </mesh>

        {[-0.65, -0.22, 0.22, 0.65].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <cylinderGeometry args={[0.75, 0.75, 0.08, 40]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.95}
              roughness={0.18}
              emissive={color}
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}

        <mesh position={[0, 1.1, 0]}>
          <coneGeometry args={[0.18, 0.45, 14]} />
          <meshStandardMaterial
            color={color}
            metalness={0.6}
            roughness={0.3}
            emissive={color}
            emissiveIntensity={2.0}
          />
        </mesh>

        <mesh position={[0, -1.0, 0]}>
          <cylinderGeometry args={[0.9, 1.0, 0.18, 40]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.9}
            roughness={0.25}
            emissive={color}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* 💥 Exploded category rings — only rendered once data has loaded */}
      <group ref={ringsGroupRef} scale={[0.0001, 0.0001, 0.0001]}>
        {categories.map((cat, i) => (
          <CategoryAxis
            key={cat.name}
            categoryIndex={i}
            category={cat}
            ringRadius={3.2 + i * 0.45}
            rotation={RING_ORIENTATIONS[i] ?? [0, 0, 0]}
            color={color}
          />
        ))}
      </group>

      {/* Holographic planet label — always faces camera */}
      <Billboard position={[0, 2.4, 0]}>
        <Text
          fontSize={0.36}
          color={hovered ? '#ffffff' : color}
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

// ── Category ring ───────────────────────────────────────────────────────────

interface CategoryAxisProps {
  categoryIndex: number;
  category: SkillCategory;
  ringRadius: number;
  rotation: [number, number, number];
  color: string;
}

function CategoryAxis({
  categoryIndex,
  category,
  ringRadius,
  rotation,
  color,
}: CategoryAxisProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Pre-compute item positions on the ring (XY plane in local space)
  const positions = category.items.map((_, idx) => {
    const angle = (idx / category.items.length) * Math.PI * 2;
    return [
      Math.cos(angle) * ringRadius,
      Math.sin(angle) * ringRadius,
      0,
    ] as [number, number, number];
  });

  let lineEnd: [number, number, number] | null = null;
  let proficiency = 0;
  if (hoveredIdx !== null) {
    proficiency = proficiencyFor(categoryIndex, hoveredIdx);
    const [px, py] = positions[hoveredIdx];
    const k = proficiency / 100;
    lineEnd = [px * k, py * k, 0];
  }

  return (
    <group rotation={rotation}>
      <Torus args={[ringRadius, 0.012, 12, 96]}>
        <meshBasicMaterial color={color} transparent opacity={0.45} />
      </Torus>

      <Billboard position={[0, ringRadius + 0.45, 0]}>
        <Text
          fontSize={0.3}
          color={color}
          letterSpacing={0.18}
          anchorX="center"
          anchorY="middle"
        >
          {category.name}
        </Text>
      </Billboard>

      {category.items.map((item, idx) => (
        <SkillItem
          key={item}
          position={positions[idx]}
          label={item}
          color={color}
          isHovered={hoveredIdx === idx}
          onHover={(h) => setHoveredIdx(h ? idx : null)}
        />
      ))}

      {lineEnd && (
        <>
          <Line
            points={[[0, 0, 0], lineEnd]}
            color={color}
            lineWidth={2}
            transparent
            opacity={0.9}
          />
          <Billboard position={[lineEnd[0] * 0.55, lineEnd[1] * 0.55 + 0.18, 0.05]}>
            <Text
              fontSize={0.18}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {`${proficiency}%`}
            </Text>
          </Billboard>
        </>
      )}
    </group>
  );
}

// ── Individual skill bullet ────────────────────────────────────────────────

interface SkillItemProps {
  position: [number, number, number];
  label: string;
  color: string;
  isHovered: boolean;
  onHover: (h: boolean) => void;
}

function SkillItem({ position, label, color, isHovered, onHover }: SkillItemProps) {
  return (
    <group position={position}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
        }}
        onPointerOut={() => onHover(false)}
      >
        <octahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 1.4 : 0.55}
        />
      </mesh>
      <Billboard position={[0, 0.26, 0]}>
        <Text
          fontSize={isHovered ? 0.17 : 0.14}
          color={isHovered ? '#ffffff' : '#cbd5e1'}
          anchorX="center"
          anchorY="middle"
          maxWidth={2.2}
        >
          {label}
        </Text>
      </Billboard>
    </group>
  );
}
