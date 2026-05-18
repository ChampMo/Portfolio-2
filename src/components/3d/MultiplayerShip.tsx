'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { planetPositions } from '@/lib/3d/planetPositions';
import { SHIP_COLOR_PRESETS, PRESET_COUNT } from '@/lib/3d/shipColors';

interface MultiplayerShipProps {
  callsign: string;
  planet: string;
  shipIndex: number;
  colorIndex: number;
}

const PLANET_KEYS = ['/skills', '/services', '/experience', '/projects', '/about'] as const;
type PlanetKey = (typeof PLANET_KEYS)[number];

function resolvePlanetKey(pathname: string): PlanetKey | null {
  for (const key of PLANET_KEYS) {
    if (pathname === key || pathname.startsWith(key + '/')) return key;
  }
  return null;
}

// ── Beam-target resolution ────────────────────────────────────────────────────
const CRYSTAL_CORE_POS = new THREE.Vector3(0, 0, 0);

function resolveBeamTarget(planet: string): THREE.Vector3 | null {
  if (!planet || planet === '/' || planet === '/overview') return null;
  if (planet === '/about' || planet.startsWith('/about/')) return CRYSTAL_CORE_POS;
  const key = resolvePlanetKey(planet);
  if (!key || key === '/about') return null;
  return planetPositions[key] ?? null;
}

// ── Ship animation constants ──────────────────────────────────────────────────
const ORBIT_RADIUS = 4.5;
const ORBIT_SPEED  = 0.35;
const LERP_SPEED   = 1.0;

// Module-level scratch for the ship's own useFrame (R3F is synchronous, one
// ship's useFrame runs to completion before another starts — no conflicts).
const _target = new THREE.Vector3();
const _dir    = new THREE.Vector3();
const _look   = new THREE.Vector3();
const _m      = new THREE.Matrix4();
const _q      = new THREE.Quaternion();
const _up     = new THREE.Vector3(0, 1, 0);

// ─────────────────────────────────────────────────────────────────────────────
// PlasmaConduit — double wobbly arc from ship → target planet / core
// ─────────────────────────────────────────────────────────────────────────────
const ARC_N = 26; // 25 segments → 26 vertices per arc

interface PlasmaConduitProps {
  sourceRef: React.RefObject<THREE.Group>;
  planet: string;
  shipIndex: number;
  beamColorA: string;
  beamColorB: string;
}

function PlasmaConduit({ sourceRef, planet, shipIndex, beamColorA, beamColorB }: PlasmaConduitProps) {
  // Per-instance scratch vectors — safe when multiple ships render simultaneously
  const s = useMemo(
    () => ({
      start: new THREE.Vector3(),
      end:   new THREE.Vector3(),
      dir:   new THREE.Vector3(),
      perpR: new THREE.Vector3(),
      perpU: new THREE.Vector3(),
      base:  new THREE.Vector3(),
    }),
    [],
  );

  const cyanPos    = useMemo(() => new Float32Array(ARC_N * 3), []);
  const fuchsiaPos = useMemo(() => new Float32Array(ARC_N * 3), []);

  const cyanAttr    = useMemo(() => new THREE.BufferAttribute(cyanPos,    3), [cyanPos]);
  const fuchsiaAttr = useMemo(() => new THREE.BufferAttribute(fuchsiaPos, 3), [fuchsiaPos]);

  const cyanGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', cyanAttr);
    return g;
  }, [cyanAttr]);

  const fuchsiaGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', fuchsiaAttr);
    return g;
  }, [fuchsiaAttr]);

  const cyanMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: beamColorA,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const fuchsiaMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: beamColorB,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const cyanLine = useMemo(() => {
    const l = new THREE.Line(cyanGeo, cyanMat);
    l.frustumCulled = false;
    return l;
  }, [cyanGeo, cyanMat]);

  const fuchsiaLine = useMemo(() => {
    const l = new THREE.Line(fuchsiaGeo, fuchsiaMat);
    l.frustumCulled = false;
    return l;
  }, [fuchsiaGeo, fuchsiaMat]);

  useEffect(
    () => () => {
      cyanGeo.dispose();
      fuchsiaGeo.dispose();
      cyanMat.dispose();
      fuchsiaMat.dispose();
    },
    [cyanGeo, fuchsiaGeo, cyanMat, fuchsiaMat],
  );

  useFrame(({ clock }) => {
    if (!sourceRef.current) return;

    const target = resolveBeamTarget(planet);
    if (!target) {
      cyanLine.visible    = false;
      fuchsiaLine.visible = false;
      return;
    }
    cyanLine.visible    = true;
    fuchsiaLine.visible = true;

    const t = clock.elapsedTime;

    s.start.copy(sourceRef.current.position);
    s.end.copy(target);

    s.dir.subVectors(s.end, s.start);
    const length = s.dir.length();
    if (length < 0.5) return;
    s.dir.divideScalar(length);

    s.perpR.set(-s.dir.z, 0, s.dir.x);
    if (s.perpR.lengthSq() < 0.001) s.perpR.set(1, 0, 0);
    s.perpR.normalize();
    s.perpU.crossVectors(s.dir, s.perpR).normalize();

    const maxAmp = Math.min(length * 0.07, 0.65);
    const f1 = Math.PI * 3.2;
    const f2 = f1 * 1.618;
    const phaseOffset = shipIndex * 1.13;

    for (let i = 0; i < ARC_N; i++) {
      const u   = i / (ARC_N - 1);
      const env = Math.sin(u * Math.PI);
      s.base.lerpVectors(s.start, s.end, u);

      const cW = env * maxAmp * (
        Math.sin(u * f1 - t * 5.5 + phaseOffset) * 0.65 +
        Math.sin(u * f2 - t * 8.8 + phaseOffset) * 0.35
      );
      const fW = env * maxAmp * (
        Math.sin(u * f1 - t * 5.5 + phaseOffset + Math.PI * 0.65) * 0.65 +
        Math.sin(u * f2 - t * 8.8 + phaseOffset + Math.PI * 1.2)  * 0.35
      );

      const idx = i * 3;
      cyanPos[idx]     = s.base.x + s.perpR.x * cW + s.perpU.x * cW * 0.35;
      cyanPos[idx + 1] = s.base.y + s.perpR.y * cW + s.perpU.y * cW * 0.35;
      cyanPos[idx + 2] = s.base.z + s.perpR.z * cW + s.perpU.z * cW * 0.35;

      fuchsiaPos[idx]     = s.base.x + s.perpR.x * fW + s.perpU.x * fW * 0.35;
      fuchsiaPos[idx + 1] = s.base.y + s.perpR.y * fW + s.perpU.y * fW * 0.35;
      fuchsiaPos[idx + 2] = s.base.z + s.perpR.z * fW + s.perpU.z * fW * 0.35;
    }

    cyanAttr.needsUpdate    = true;
    fuchsiaAttr.needsUpdate = true;

    cyanMat.opacity    = 0.5 + Math.sin(t * 7.1 + shipIndex * 2.3) * 0.2;
    fuchsiaMat.opacity = 0.5 + Math.sin(t * 5.9 + shipIndex * 3.8) * 0.2;
  });

  return (
    <>
      <primitive object={cyanLine} />
      <primitive object={fuchsiaLine} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MultiplayerShip — procedural low-poly spaceship
// ─────────────────────────────────────────────────────────────────────────────
export default function MultiplayerShip({
  callsign,
  planet,
  shipIndex,
  colorIndex,
}: MultiplayerShipProps) {
  // Resolve color preset once at mount (colorIndex never changes during lifetime)
  const preset = SHIP_COLOR_PRESETS[colorIndex % PRESET_COUNT];

  const groupRef   = useRef<THREE.Group>(null!);
  const angle      = useRef((shipIndex * Math.PI * 0.618033) % (Math.PI * 2));
  const currentPos = useRef(
    new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      6 + Math.random() * 4,
      (Math.random() - 0.5) * 30,
    ),
  );

  // ── Materials — built once, all colors driven by the preset ────────────────
  const hullMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: preset.hull,
        roughness: 0.18,
        metalness: 0.96,
        clearcoat: 0.95,
        clearcoatRoughness: 0.04,
        emissive: new THREE.Color(preset.emissiveHull),
        emissiveIntensity: 0.6,
        depthWrite: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const accentMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: preset.accent,
        roughness: 0.14,
        metalness: 0.88,
        clearcoat: 0.7,
        clearcoatRoughness: 0.08,
        emissive: new THREE.Color(preset.emissiveAccent),
        emissiveIntensity: 1.5,
        depthWrite: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const cockpitMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: preset.cockpit,
        emissive: new THREE.Color(preset.cockpit),
        emissiveIntensity: 4.5,
        roughness: 0.0,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        transparent: true,
        opacity: 0.88,
        depthWrite: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const thrusterMatA = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: preset.thrusterA,
        emissive: new THREE.Color(preset.thrusterA),
        emissiveIntensity: 10,
        roughness: 0.0,
        metalness: 0.05,
        depthWrite: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const thrusterMatB = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: preset.thrusterB,
        emissive: new THREE.Color(preset.thrusterB),
        emissiveIntensity: 10,
        roughness: 0.0,
        metalness: 0.05,
        depthWrite: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const stripeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: preset.thrusterA,
        emissive: new THREE.Color(preset.thrusterA),
        emissiveIntensity: 3.5,
        roughness: 0.05,
        metalness: 0.2,
        depthWrite: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const haloMatA = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: preset.thrusterA,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const haloMatB = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: preset.thrusterB,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(
    () => () => {
      [
        hullMat, accentMat, cockpitMat,
        thrusterMatA, thrusterMatB, stripeMat,
        haloMatA, haloMatB,
      ].forEach((m) => m.dispose());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── Per-frame: orbit + orientation + thruster pulse ───────────────────────
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    angle.current += ORBIT_SPEED * delta;

    const planetKey = resolvePlanetKey(planet);
    const base = planetKey ? planetPositions[planetKey] : null;

    const cx = base ? base.x : 0;
    const cy = base ? base.y + 2.0 : 5.0;
    const cz = base ? base.z : 0;

    _target.set(
      cx + Math.cos(angle.current) * ORBIT_RADIUS,
      cy,
      cz + Math.sin(angle.current) * ORBIT_RADIUS,
    );

    const k = 1 - Math.exp(-delta * LERP_SPEED);
    currentPos.current.lerp(_target, k);

    groupRef.current.position.set(
      currentPos.current.x,
      currentPos.current.y + Math.sin(state.clock.elapsedTime * 1.3 + shipIndex * 1.9) * 0.12,
      currentPos.current.z,
    );

    _dir.set(-Math.sin(angle.current), 0, Math.cos(angle.current));
    _look.copy(groupRef.current.position).add(_dir);
    _m.lookAt(groupRef.current.position, _look, _up);
    _q.setFromRotationMatrix(_m);
    groupRef.current.quaternion.slerp(_q, Math.min(1, delta * 5));

    const pulse = Math.sin(state.clock.elapsedTime * 9 + shipIndex * 2.4) * 0.5 + 0.5;
    thrusterMatA.emissiveIntensity = 8 + pulse * 7;
    thrusterMatB.emissiveIntensity = 8 + pulse * 7;
    haloMatA.opacity = 0.12 + pulse * 0.16;
    haloMatB.opacity = 0.12 + pulse * 0.16;
  });

  return (
    <>
      {/* ── Ship geometry ── */}
      <group ref={groupRef}>
        {/* Hull body */}
        <mesh material={hullMat} castShadow>
          <boxGeometry args={[0.42, 0.14, 1.05]} />
        </mesh>

        {/* Dorsal spine ridge */}
        <mesh position={[0, 0.1, 0.05]} material={accentMat} castShadow>
          <boxGeometry args={[0.1, 0.08, 0.7]} />
        </mesh>

        {/* Nose cone */}
        <mesh position={[0, 0, -0.77]} rotation={[-Math.PI / 2, 0, 0]} material={hullMat} castShadow>
          <coneGeometry args={[0.13, 0.52, 6]} />
        </mesh>

        {/* Nose sensor ring */}
        <mesh position={[0, 0, -0.53]} rotation={[Math.PI / 2, 0, 0]} material={stripeMat}>
          <torusGeometry args={[0.1, 0.018, 6, 16]} />
        </mesh>

        {/* Wings */}
        <mesh position={[-0.58, -0.04, 0.08]} rotation={[0, 0, -0.18]} material={accentMat} castShadow>
          <boxGeometry args={[0.72, 0.045, 0.48]} />
        </mesh>
        <mesh position={[0.58, -0.04, 0.08]} rotation={[0, 0, 0.18]} material={accentMat} castShadow>
          <boxGeometry args={[0.72, 0.045, 0.48]} />
        </mesh>

        {/* Wing leading-edge glow stripes */}
        <mesh position={[-0.58, -0.015, -0.13]} material={stripeMat}>
          <boxGeometry args={[0.66, 0.02, 0.06]} />
        </mesh>
        <mesh position={[0.58, -0.015, -0.13]} material={stripeMat}>
          <boxGeometry args={[0.66, 0.02, 0.06]} />
        </mesh>

        {/* Wing-tip accent lights */}
        <mesh position={[-0.93, -0.04, 0.08]} material={thrusterMatA}>
          <boxGeometry args={[0.055, 0.09, 0.14]} />
        </mesh>
        <mesh position={[0.93, -0.04, 0.08]} material={thrusterMatB}>
          <boxGeometry args={[0.055, 0.09, 0.14]} />
        </mesh>

        {/* Cockpit dome */}
        <mesh position={[0, 0.14, -0.08]} material={cockpitMat}>
          <sphereGeometry args={[0.13, 8, 6]} />
        </mesh>

        {/* Engine nacelles */}
        <mesh position={[-0.2, -0.06, 0.58]} rotation={[Math.PI / 2, 0, 0]} material={hullMat} castShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.32, 8]} />
        </mesh>
        <mesh position={[0.2, -0.06, 0.58]} rotation={[Math.PI / 2, 0, 0]} material={hullMat} castShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.32, 8]} />
        </mesh>

        {/* Exhaust bells */}
        <mesh position={[-0.2, -0.06, 0.76]} rotation={[Math.PI / 2, 0, 0]} material={hullMat}>
          <cylinderGeometry args={[0.08, 0.11, 0.1, 8]} />
        </mesh>
        <mesh position={[0.2, -0.06, 0.76]} rotation={[Math.PI / 2, 0, 0]} material={hullMat}>
          <cylinderGeometry args={[0.08, 0.11, 0.1, 8]} />
        </mesh>

        {/* Thruster core discs */}
        <mesh position={[-0.2, -0.06, 0.82]} rotation={[Math.PI / 2, 0, 0]} material={thrusterMatA}>
          <cylinderGeometry args={[0.072, 0.028, 0.14, 8]} />
        </mesh>
        <mesh position={[0.2, -0.06, 0.82]} rotation={[Math.PI / 2, 0, 0]} material={thrusterMatB}>
          <cylinderGeometry args={[0.072, 0.028, 0.14, 8]} />
        </mesh>

        {/* Fake bloom halos */}
        <mesh position={[-0.2, -0.06, 0.88]} material={haloMatA}>
          <sphereGeometry args={[0.26, 8, 6]} />
        </mesh>
        <mesh position={[0.2, -0.06, 0.88]} material={haloMatB}>
          <sphereGeometry args={[0.26, 8, 6]} />
        </mesh>

        {/* Callsign billboard */}
        <Billboard position={[0, 0.95, 0]} follow lockX={false} lockY={false} lockZ={false}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[callsign.length * 0.115 + 0.22, 0.32]} />
            <meshBasicMaterial color="#000918" transparent opacity={0.65} depthWrite={true} />
          </mesh>
          <Text
            fontSize={0.19}
            color={preset.cockpit}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.025}
            outlineColor="#001428"
            depthOffset={-2}
            material-depthWrite={true}
          >
            {callsign}
          </Text>
        </Billboard>
      </group>

      {/* ── Plasma conduit — world-space sibling of ship group ── */}
      <PlasmaConduit
        sourceRef={groupRef}
        planet={planet}
        shipIndex={shipIndex}
        beamColorA={preset.beamA}
        beamColorB={preset.beamB}
      />
    </>
  );
}
