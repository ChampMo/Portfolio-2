// ไฟล์: src/components/3d/ChronoRingPlanet.tsx
// 🕰️ PLANET 3 — CHRONO-RING (/experience)
// • Body: a flattened TorusGeometry — an astronomical time dial.
// • Idle: dial slowly auto-rotates around Y.
// • Focused (pathname === '/experience'):
//     – Auto-rotation stops; user can click-and-drag horizontally to spin the dial.
//     – Snap-to-nearest-stop on release (with light inertia).
//     – A floating PlaneGeometry card rises above and shows the entry currently
//       aligned with the stationary pointer at 12 o'clock.
'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text, Torus, Billboard, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter, usePathname } from 'next/navigation';
import gsap from 'gsap';
import { useOrbitPosition, type OrbitParams } from '@/lib/3d/useOrbitPosition';
import { experienceData } from '@/lib/mock/experience';

interface ChronoRingPlanetProps extends OrbitParams {
  color: string;
  label: string;
}

const DIAL_RADIUS = 2.0;
const DIAL_TUBE = 0.55;
const DIAL_FLATTEN = 0.18;

const TAU = Math.PI * 2;
const ENTRY_COUNT = experienceData.entries.length;
const STEP = TAU / ENTRY_COUNT;

export default function ChronoRingPlanet({
  color,
  label,
  ...orbit
}: ChronoRingPlanetProps) {
  const groupRef = useOrbitPosition(orbit);
  const router = useRouter();
  const pathname = usePathname();
  const isFocused = pathname === orbit.path;

  const dialRef = useRef<THREE.Group>(null);
  const cardRef = useRef<THREE.Group>(null);

  const [hovered, setHovered] = useState(false);
  const [alignedIdx, setAlignedIdx] = useState(0);
  useCursor(hovered);

  // Drag state — stored in refs to avoid re-render churn
  const dragging = useRef(false);
  const lastClientX = useRef(0);
  const movedDistance = useRef(0);
  const angularVel = useRef(0);

  // Re-read latest focus state inside event handlers without closure staleness
  const focusedRef = useRef(isFocused);
  useEffect(() => { focusedRef.current = isFocused; }, [isFocused]);

  // 🔁 Per-frame: idle auto-spin OR drag/inertia, then update aligned index
  useFrame((_, delta) => {
    const dial = dialRef.current;
    if (!dial) return;

    if (!isFocused) {
      // Calm auto-rotation when nobody's looking
      dial.rotation.y += delta * 0.15;
    } else if (!dragging.current) {
      // Inertia decay after release
      dial.rotation.y += angularVel.current;
      angularVel.current *= 0.92;
      if (Math.abs(angularVel.current) < 0.0005) angularVel.current = 0;
    }

    // Aligned entry: the one currently at the pointer (+Z direction)
    const norm = ((dial.rotation.y % TAU) + TAU) % TAU;
    const idx = Math.round(norm / STEP) % ENTRY_COUNT;
    if (idx !== alignedIdx) setAlignedIdx(idx);
  });

  // 🎬 Card rises on focus enter, collapses on exit
  useEffect(() => {
    const c = cardRef.current;
    if (!c) return;
    const target = isFocused ? 1 : 0.001;
    gsap.to(c.scale, {
      x: target,
      y: target,
      z: target,
      duration: 1.0,
      ease: isFocused ? 'back.out(1.4)' : 'power2.in',
      overwrite: true,
    });
  }, [isFocused]);

  const snapDialToNearestStop = () => {
    const dial = dialRef.current;
    if (!dial) return;
    const snapped = Math.round(dial.rotation.y / STEP) * STEP;
    gsap.to(dial.rotation, {
      y: snapped,
      duration: 0.55,
      ease: 'power3.out',
      overwrite: true,
    });
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!focusedRef.current) return; // not in drag mode — let onClick handle navigation
    e.stopPropagation();
    dragging.current = true;
    movedDistance.current = 0;
    lastClientX.current = e.clientX;
    angularVel.current = 0;

    const onMove = (ev: PointerEvent) => {
      if (!dragging.current || !dialRef.current) return;
      const dx = ev.clientX - lastClientX.current;
      lastClientX.current = ev.clientX;
      movedDistance.current += Math.abs(dx);
      const rotSpeed = 0.01;
      const dRot = dx * rotSpeed;
      dialRef.current.rotation.y += dRot;
      angularVel.current = dRot * 0.6;
    };

    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      // Snap if we're basically stopped
      if (Math.abs(angularVel.current) < 0.012) {
        snapDialToNearestStop();
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Treat short drag as a click; ignore drags that traveled far
    if (movedDistance.current > 6) return;
    if (!isFocused) router.push(orbit.path);
  };

  const aligned = experienceData.entries[alignedIdx];

  return (
    <group ref={groupRef}>
      {/* 🎯 Stationary pointer indicator at +Z ("12 o'clock") — alignment marker */}
      <mesh
        position={[0, 0.5, DIAL_RADIUS + 0.15]}
        rotation={[Math.PI, 0, 0]}
      >
        <coneGeometry args={[0.16, 0.42, 4]} />
        <meshStandardMaterial
          color="#fde047"
          emissive="#fde047"
          emissiveIntensity={1.2}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* 🕰️ Draggable dial */}
      <group
        ref={dialRef}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Flattened torus body */}
        <mesh scale={[1, DIAL_FLATTEN, 1]}>
          <torusGeometry args={[DIAL_RADIUS, DIAL_TUBE, 16, 96]} />
          <meshStandardMaterial
            color={hovered ? '#60a5fa' : color}
            emissive={color}
            emissiveIntensity={0.4}
            metalness={0.85}
            roughness={0.3}
          />
        </mesh>

        {/* Inner and outer gradation rings */}
        <Torus args={[DIAL_RADIUS - 0.08, 0.012, 8, 96]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#67e8f9" transparent opacity={0.55} />
        </Torus>
        <Torus args={[DIAL_RADIUS + 0.08, 0.012, 8, 96]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#67e8f9" transparent opacity={0.4} />
        </Torus>

        {/* Entry markers around the dial */}
        {experienceData.entries.map((entry, i) => {
          // Place at angle i*STEP on the dial: x = sin, z = cos so that i=0 starts
          // at +Z, matching the pointer indicator.
          const a = i * STEP;
          const x = Math.sin(a) * DIAL_RADIUS;
          const z = Math.cos(a) * DIAL_RADIUS;
          const isAligned = alignedIdx === i;
          return (
            <group key={entry.id} position={[x, 0.16, z]}>
              {/* Tick marker on dial surface */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.12, 0.08, 0.12]} />
                <meshStandardMaterial
                  color="#22d3ee"
                  emissive="#22d3ee"
                  emissiveIntensity={isAligned ? 1.8 : 0.55}
                  metalness={0.6}
                  roughness={0.25}
                />
              </mesh>
              {/* Year text, always facing camera */}
              <Billboard position={[0, 0.32, 0]}>
                <Text
                  fontSize={isAligned ? 0.2 : 0.16}
                  color={isAligned ? '#ffffff' : '#a5f3fc'}
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0.005}
                  outlineColor="#000000"
                  raycast={() => null}
                >
                  {entry.time}
                </Text>
              </Billboard>
            </group>
          );
        })}
      </group>

      {/* 🪧 Floating data card (rises on focus, billboarded) */}
      <group ref={cardRef} position={[0, 2.2, 0]} scale={[0.001, 0.001, 0.001]}>
        <Billboard>
          {/* Border glow */}
          <mesh position={[0, 0, -0.002]}>
            <planeGeometry args={[3.8, 2.0]} />
            <meshBasicMaterial color={color} transparent opacity={0.45} />
          </mesh>
          {/* Card background */}
          <mesh>
            <planeGeometry args={[3.7, 1.9]} />
            <meshBasicMaterial color="#0b1220" transparent opacity={0.85} />
          </mesh>

          <Text
            position={[0, 0.62, 0.01]}
            fontSize={0.2}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            maxWidth={3.4}
            raycast={() => null}
          >
            {aligned.role}
          </Text>
          <Text
            position={[0, 0.3, 0.01]}
            fontSize={0.14}
            color={color}
            anchorX="center"
            anchorY="middle"
            maxWidth={3.4}
            raycast={() => null}
          >
            {aligned.organization}
          </Text>
          <Text
            position={[0, 0.06, 0.01]}
            fontSize={0.11}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
            maxWidth={3.4}
            raycast={() => null}
          >
            {`${aligned.time}   ·   ${aligned.location}`}
          </Text>
          <Text
            position={[0, -0.32, 0.01]}
            fontSize={0.11}
            color="#cbd5e1"
            anchorX="center"
            anchorY="middle"
            maxWidth={3.4}
            textAlign="center"
            raycast={() => null}
          >
            {aligned.summary}
          </Text>
          <Text
            position={[0, -0.78, 0.01]}
            fontSize={0.09}
            color="#475569"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.25}
            raycast={() => null}
          >
            {`[ ${alignedIdx + 1} / ${ENTRY_COUNT} — DRAG DIAL TO SCROLL ]`}
          </Text>
        </Billboard>
      </group>

      {/* Planet label (below the dial like a nameplate) */}
      <Text
        position={[0, -1.2, 0]}
        fontSize={0.32}
        color={hovered ? '#ffffff' : color}
        letterSpacing={0.2}
        anchorX="center"
        anchorY="middle"
        raycast={() => null}
      >
        {label}
      </Text>
    </group>
  );
}
