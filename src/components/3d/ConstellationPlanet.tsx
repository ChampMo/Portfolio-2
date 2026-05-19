// ไฟล์: src/components/3d/ConstellationPlanet.tsx
// 🌌 PLANET 4 — CONSTELLATION (/projects)
// • Body: a triangular cluster of project-stars connected by drei <Line>s.
//   Local Sparkles add nebula atmosphere.
// • Idle: cluster orbits like the others.
// • Focused (pathname === '/projects'):
//     – Clicking a star sets `focusedProjectId` in Zustand.
//     – The cluster's inner group GSAP-shifts so the chosen star slides to the
//       orbital origin — combined with CameraRig's planet follow, this produces
//       a "warp through the star" effect.
//     – A glassmorphism mockup panel (meshPhysicalMaterial transmission) and a
//       repo-link button appear next to the focused star. Clicking the same
//       star again (or leaving /projects) collapses the sub-view.
'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text, Sparkles, Line, Billboard, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter, usePathname } from 'next/navigation';
import gsap from 'gsap';
import { useOrbitPosition, type OrbitParams } from '@/lib/3d/useOrbitPosition';
import { useAppStore } from '@/lib/store/useAppStore';

// Matches the Project Mongoose model returned by GET /api/projects
type ApiProject = {
  _id: string;
  title: string;
  time: string;
  coverImage: string;
  tags: string[];
  blocks: Array<{ id: string; type: string; content: unknown }>;
};

// Normalised shape consumed by the 3D sub-components
type DisplayProject = {
  id: string;
  name: string;
  codename: string;
  year: string;
  status: string;
  summary: string;
  stack: string[];
  repoUrl?: string;
};

function toDisplayProject(p: ApiProject): DisplayProject {
  // Attempt to pull the first text/paragraph block as a summary
  const textBlock = p.blocks.find(
    (b) => (b.type === 'paragraph' || b.type === 'text') && typeof b.content === 'string'
  );
  const summary =
    typeof textBlock?.content === 'string'
      ? textBlock.content
      : p.tags.length > 0
      ? p.tags.join(' · ')
      : p.title;

  return {
    id: String(p._id),
    name: p.title,
    codename: `PROJECT_${p.title.toUpperCase().replace(/\s+/g, '_')}`,
    year: p.time,
    status: 'DEPLOYED',
    summary,
    stack: p.tags,
  };
}

interface ConstellationPlanetProps extends OrbitParams {
  color: string;
  label: string;
  scale?: number;
}

// Triangular nebula formation — one local position per project slot (up to 3).
const STAR_POSITIONS: Array<[number, number, number]> = [
  [0, 0.9, 0],          // top
  [-1.5, -0.7, 0.4],    // bottom-left
  [1.5, -0.7, -0.4],    // bottom-right
];

// Connecting line pairs (indices into STAR_POSITIONS)
const ALL_LINKS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 0],
];

export default function ConstellationPlanet({
  color,
  label,
  scale,
  ...orbit
}: ConstellationPlanetProps) {
  const groupRef = useOrbitPosition(orbit);
  const innerRef = useRef<THREE.Group>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isFocused = pathname.startsWith(orbit.path);

  const focusedProjectId = useAppStore((s) => s.focusedProjectId);
  const setFocusedProjectId = useAppStore((s) => s.setFocusedProjectId);
  const setSummaryMode = useAppStore((s) => s.setSummaryMode);

  const [planetHovered, setPlanetHovered] = useState(false);
  const [projects, setProjects] = useState<DisplayProject[]>([]);
  useCursor(planetHovered);

  // Fetch live project data from the API
  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data: unknown) => {
        const raw = Array.isArray(data) ? (data as ApiProject[]) : [];
        setProjects(raw.slice(0, STAR_POSITIONS.length).map(toDisplayProject));
      })
      .catch(() => setProjects([]));
  }, []);

  const focusedIdx = focusedProjectId
    ? projects.findIndex((p) => p.id === focusedProjectId)
    : -1;

  // Only draw lines between positions that both have a project star
  const validLinks = ALL_LINKS.filter(
    ([a, b]) => a < projects.length && b < projects.length
  );

  // 💫 Shift inner group so the focused star ends up at the orbital origin
  useEffect(() => {
    const g = innerRef.current;
    if (!g) return;
    const target =
      focusedIdx >= 0
        ? ([
            -STAR_POSITIONS[focusedIdx][0],
            -STAR_POSITIONS[focusedIdx][1],
            -STAR_POSITIONS[focusedIdx][2],
          ] as [number, number, number])
        : ([0, 0, 0] as [number, number, number]);
    gsap.to(g.position, {
      x: target[0],
      y: target[1],
      z: target[2],
      duration: 1.2,
      ease: 'power3.inOut',
      overwrite: true,
    });
  }, [focusedIdx]);

  // Clear sub-view when navigating away from /projects
  useEffect(() => {
    if (!isFocused && focusedProjectId) setFocusedProjectId(null);
  }, [isFocused, focusedProjectId, setFocusedProjectId]);

  const handlePlanetClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!isFocused) router.push(orbit.path);
    setSummaryMode(true);
  };

  const handleStarClick = (project: DisplayProject) => {
    if (!isFocused) {
      router.push(orbit.path);
      setSummaryMode(true);
      return;
    }
    const next = focusedProjectId === project.id ? null : project.id;
    setFocusedProjectId(next);
    if (next !== null) {
      router.push(`/projects/${next}`);
      setSummaryMode(true);
    } else {
      router.push('/projects');
    }
  };

  return (
    <group ref={groupRef} scale={scale ?? 1}>
      {/* Generous hitbox so the cluster stays clickable from far away */}
      <mesh
        visible={false}
        onClick={handlePlanetClick}
        onPointerOver={() => setPlanetHovered(true)}
        onPointerOut={() => setPlanetHovered(false)}
      >
        <sphereGeometry args={[3.0, 16, 16]} />
      </mesh>

      {/* Inner group — translates so the focused star slides to local origin */}
      <group ref={innerRef}>
        {/* Connecting constellation lines — filtered to positions with actual stars */}
        {validLinks.map(([a, b], i) => (
          <Line
            key={i}
            points={[STAR_POSITIONS[a], STAR_POSITIONS[b]]}
            color={color}
            lineWidth={1.2}
            transparent
            opacity={0.5}
          />
        ))}

        {/* Stars — rendered only once data has loaded */}
        {projects.map((project, i) => (
          <ProjectStar
            key={project.id}
            project={project}
            position={STAR_POSITIONS[i]}
            color={color}
            isFocused={focusedIdx === i}
            isAnyFocused={focusedIdx !== -1}
            onClick={() => handleStarClick(project)}
          />
        ))}

        {/* Nebula sparkles */}
        <Sparkles count={70} scale={4.5} size={3} speed={0.4} opacity={0.6} color={color} />
      </group>

      {/* Project sub-view — anchored to the orbital origin (i.e. the focused star post-shift) */}
      {focusedIdx >= 0 && isFocused && projects[focusedIdx] && (
        <ProjectDetail
          key={projects[focusedIdx].id}
          project={projects[focusedIdx]}
          color={color}
        />
      )}

      {/* Cluster label — always faces camera */}
      <Billboard position={[0, 2.6, 0]}>
        <Text
          fontSize={0.32}
          color={planetHovered ? '#ffffff' : color}
          letterSpacing={0.2}
          anchorX="center"
          anchorY="middle"
          raycast={() => null}
        >
          {label}
        </Text>
      </Billboard>
    </group>
  );
}

// ── Single project star ─────────────────────────────────────────────────────

interface ProjectStarProps {
  project: DisplayProject;
  position: [number, number, number];
  color: string;
  isFocused: boolean;
  isAnyFocused: boolean;
  onClick: () => void;
}

function ProjectStar({
  project,
  position,
  color,
  isFocused,
  isAnyFocused,
  onClick,
}: ProjectStarProps) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const meshRef = useRef<THREE.Mesh>(null);

  // Pulse the focused star; shrink the unfocused ones when something else is focused
  useFrame((state) => {
    const m = meshRef.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    const baseScale = isFocused ? 1.8 : isAnyFocused ? 0.55 : 1.0;
    const pulse = isFocused ? 1 + Math.sin(t * 2) * 0.08 : 1;
    m.scale.setScalar(baseScale * pulse);
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={color}
          emissiveIntensity={hovered || isFocused ? 4.0 : 2.2}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>

      {/* Star glow halo */}
      <pointLight
        color={color}
        intensity={hovered || isFocused ? 4.0 : 1.8}
        distance={4.0}
      />

      {/* Project name — always faces camera */}
      <Billboard position={[0, 0.5, 0]}>
        <Text
          fontSize={hovered || isFocused ? 0.18 : 0.14}
          color={isFocused ? '#ffffff' : color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#000000"
          raycast={() => null}
        >
          {project.name}
        </Text>
      </Billboard>
    </group>
  );
}

// ── Glassmorphism project mockup ────────────────────────────────────────────

interface ProjectDetailProps {
  project: DisplayProject;
  color: string;
}

function ProjectDetail({ project, color }: ProjectDetailProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Rise on mount (key on project.id makes this re-fire when switching projects)
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.scale.setScalar(0.001);
    gsap.to(g.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.9,
      ease: 'back.out(1.4)',
      overwrite: true,
    });
  }, [project.id]);

  return (
    <group ref={groupRef} position={[2.8, 0, 0]}>
      <Billboard>
        {/* Outer glow border */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[3.6, 2.1]} />
          <meshBasicMaterial color={color} transparent opacity={0.45} />
        </mesh>

        {/* Glassmorphism screen panel */}
        <mesh>
          <planeGeometry args={[3.5, 2.0]} />
          <meshPhysicalMaterial
            color="#0b1220"
            metalness={0.2}
            roughness={0.05}
            transmission={0.5}
            thickness={0.2}
            clearcoat={1}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Laptop base hint strip */}
        <mesh position={[0, -1.18, -0.005]}>
          <planeGeometry args={[3.85, 0.18]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} />
        </mesh>

        <Text
          position={[0, 0.7, 0.01]}
          fontSize={0.24}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={3.1}
          raycast={() => null}
        >
          {project.name}
        </Text>
        <Text
          position={[0, 0.4, 0.01]}
          fontSize={0.11}
          color={color}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.2}
          raycast={() => null}
        >
          {`${project.codename}  ·  ${project.year}  ·  ${project.status}`}
        </Text>
        <Text
          position={[0, 0.05, 0.01]}
          fontSize={0.13}
          color="#cbd5e1"
          anchorX="center"
          anchorY="middle"
          maxWidth={3.1}
          textAlign="center"
          raycast={() => null}
        >
          {project.summary}
        </Text>
        <Text
          position={[0, -0.55, 0.01]}
          fontSize={0.1}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
          maxWidth={3.1}
          textAlign="center"
          raycast={() => null}
        >
          {project.stack.join('  ·  ')}
        </Text>
        <Text
          position={[0, -0.92, 0.01]}
          fontSize={0.09}
          color="#475569"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.25}
          raycast={() => null}
        >
          [ CLICK STAR AGAIN TO COLLAPSE ]
        </Text>
      </Billboard>

      {/* Repo link button — only shown when a URL is available */}
      {project.repoUrl && (
        <RepoLink position={[0, -1.55, 0]} url={project.repoUrl} color={color} />
      )}
    </group>
  );
}

// ── External link button ────────────────────────────────────────────────────

interface RepoLinkProps {
  position: [number, number, number];
  url: string;
  color: string;
}

function RepoLink({ position, url, color }: RepoLinkProps) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  return (
    <Billboard position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          if (typeof window !== 'undefined') {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[1.7, 0.34]} />
        <meshBasicMaterial
          color={hovered ? color : '#0b1220'}
          transparent
          opacity={hovered ? 0.7 : 0.85}
        />
      </mesh>
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.13}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.15}
        raycast={() => null}
      >
        [ OPEN REPOSITORY ↗ ]
      </Text>
    </Billboard>
  );
}
