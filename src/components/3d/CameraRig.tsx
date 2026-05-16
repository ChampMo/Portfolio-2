// ไฟล์: src/components/3d/CameraRig.tsx
'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import * as THREE from 'three';
import { useAppStore } from '@/lib/store/useAppStore';
import { planetPositions } from '@/lib/3d/planetPositions';

// 🗺️ Static warp targets for non-planet routes.
// Overview = high tilted bird's-eye on the entire orbital plane.
// Core    = eye-level close-up locked on the CrystalCore.
const warpCoordinates: Record<string, { pos: [number, number, number]; lookAt: [number, number, number] }> = {
  // 🌌 หน้ารวม: เพิ่ม Z จาก 42 เป็น 55-60 เพื่อถอยให้เห็นกว้างขึ้น
  '/':         { pos: [0, 20, 50], lookAt: [0, 0, 0] },
  '/overview': { pos: [0, 20, 50], lookAt: [0, 0, 0] },

  // 🔮 หน้า Core: เพิ่ม Z จาก 16 เป็น 20-24 ให้ไม่ชิดคริสตัลเกินไป
  '/about':    { pos: [0, 1, 12],  lookAt: [0, 0, 0] },
};

// 🪐 Planet routes are handled dynamically (their target moves each frame).
const PLANET_PATHS = new Set(['/skills', '/services', '/experience', '/projects']);

// Camera offset when zoomed onto a planet — bumped for cinematic framing
const PLANET_CAM_DIST = 11.0; // outward radial distance from the planet
const PLANET_CAM_LIFT = 4.0;  // vertical lift above the planet

// 🔍 Wheel-zoom configuration
const ZOOM_MIN = -10;
const ZOOM_MAX = 15;
const ZOOM_SENSITIVITY = 0.012;     // wheel deltaY × sensitivity per tick
const MIN_PLANET_DIST = 3.0;        // never let the camera punch through a planet

export default function CameraRig() {
  const { camera } = useThree();
  const pathname = usePathname();
  const isSystemBooted = useAppStore((state) => state.isSystemBooted);

  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0));
  const desiredPos = useRef(new THREE.Vector3());
  const desiredLook = useRef(new THREE.Vector3());
  const radial = useRef(new THREE.Vector3());

  // 🔍 Mutable scroll-wheel zoom accumulator (clamped). Positive = zoomed out.
  const zoomOffset = useRef(0);
  // Pathname mirror so event listeners read the current value without re-binding.
  const pathnameRef = useRef(pathname);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  // GSAP warp helper for STATIC routes — applies zoomOffset along the away-vector
  const applyStaticWarp = useCallback((duration = 1.2) => {
    const path = pathnameRef.current;
    if (PLANET_PATHS.has(path)) return;
    const target = warpCoordinates[path] ?? warpCoordinates['/'];
    const [bx, by, bz] = target.pos;
    const [lx, ly, lz] = target.lookAt;
    // Unit vector pointing from lookAt → basePos ("away" direction)
    const ax = bx - lx, ay = by - ly, az = bz - lz;
    const len = Math.hypot(ax, ay, az) || 1;
    const z = zoomOffset.current;
    const px = bx + (ax / len) * z;
    const py = by + (ay / len) * z;
    const pz = bz + (az / len) * z;

    gsap.to(camera.position, {
      x: px, y: py, z: pz,
      duration,
      ease: 'power2.out',
      overwrite: true,
    });
    gsap.to(lookAtTarget.current, {
      x: lx, y: ly, z: lz,
      duration,
      ease: 'power2.out',
      overwrite: true,
    });
  }, [camera]);

  // 🎬 Pathname change: reset zoom, then either warp (static) or hand off to per-frame follow (planet)
  useEffect(() => {
    if (!isSystemBooted) return;
    // Each new sector starts at its curated framing
    zoomOffset.current = 0;

    if (PLANET_PATHS.has(pathname)) {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(lookAtTarget.current);
      return;
    }
    applyStaticWarp(2.2);
  }, [pathname, isSystemBooted, camera, applyStaticWarp]);

  // 🖱️ Wheel listener — accumulate clamped zoomOffset, and re-warp static routes
  useEffect(() => {
    if (!isSystemBooted) return;
    const onWheel = (e: WheelEvent) => {
      zoomOffset.current = THREE.MathUtils.clamp(
        zoomOffset.current + e.deltaY * ZOOM_SENSITIVITY,
        ZOOM_MIN,
        ZOOM_MAX,
      );
      // Static routes need their GSAP target re-pointed. Planet routes pick up the
      // new offset automatically in useFrame.
      if (!PLANET_PATHS.has(pathnameRef.current)) {
        applyStaticWarp(0.45);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [isSystemBooted, applyStaticWarp]);

  // 🛰️ Per-frame dynamic follow for orbiting planet routes + lookAt application.
  useFrame((_, delta) => {
    if (!isSystemBooted) return;

    if (PLANET_PATHS.has(pathname)) {
      const p = planetPositions[pathname];
      if (p) {
        // Position camera outward along the planet's radial vector from origin,
        // slightly elevated, so we look back toward the CrystalCore through the planet.
        radial.current.set(p.x, 0, p.z);
        const len = radial.current.length() || 1;
        radial.current.multiplyScalar(1 / len);

        const dist = Math.max(MIN_PLANET_DIST, PLANET_CAM_DIST + zoomOffset.current);
        desiredPos.current.set(
          p.x + radial.current.x * dist,
          p.y + PLANET_CAM_LIFT,
          p.z + radial.current.z * dist,
        );
        desiredLook.current.copy(p);

        // Frame-rate independent smoothing
        const k = 1 - Math.exp(-delta * 1.6);
        camera.position.lerp(desiredPos.current, k);
        lookAtTarget.current.lerp(desiredLook.current, k);
      }
    }

    // Always re-apply lookAt from the (GSAP- or lerp-) animated target
    camera.lookAt(lookAtTarget.current);
  });

  return null;
}