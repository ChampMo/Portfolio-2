// ไฟล์: src/components/3d/CameraRig.tsx
'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import * as THREE from 'three';
import { useAppStore } from '@/lib/store/useAppStore';
import { planetPositions } from '@/lib/3d/planetPositions';
import { audioManager } from '@/lib/audio/audioManager';

// 🗺️ Static warp targets for non-planet routes.
// Overview = high tilted bird's-eye on the entire orbital plane.
// Core    = eye-level close-up locked on the CrystalCore.
const warpCoordinates: Record<string, { pos: [number, number, number]; lookAt: [number, number, number] }> = {
  // 🌌 หน้ารวม: เพิ่ม Z จาก 42 เป็น 55-60 เพื่อถอยให้เห็นกว้างขึ้น
  '/':         { pos: [0, 20, 50], lookAt: [0, 0, 0] },
  '/overview': { pos: [0, 20, 50], lookAt: [0, 0, 0] },

  '/about':    { pos: [0, 3, 17],  lookAt: [0, 0, 0] },
};

// 🪐 Planet routes are handled dynamically (their target moves each frame).
const PLANET_PATHS = new Set(['/skills', '/services', '/experience', '/projects']);

// Resolve sub-routes (e.g. /projects/abc) back to their parent planet path.
function getPlanetRoute(path: string): string | null {
  if (PLANET_PATHS.has(path)) return path;
  for (const p of PLANET_PATHS) {
    if (path.startsWith(p + '/')) return p;
  }
  return null;
}

// Camera offset when zoomed onto a planet — bumped for cinematic framing
const PLANET_CAM_DIST = 18.0; // outward radial distance from the planet
const PLANET_CAM_LIFT = 4.0;  // vertical lift above the planet

// 🔍 Wheel-zoom configuration
const ZOOM_MIN = -10;
const ZOOM_MAX = 15;
const ZOOM_SENSITIVITY  = 0.012;    // wheel deltaY × sensitivity per tick
const PINCH_SENSITIVITY = 0.055;    // pinch pixel-delta × sensitivity per frame
const MIN_PLANET_DIST   = 3.0;      // never let the camera punch through a planet

export default function CameraRig() {
  const { camera } = useThree();
  const pathname = usePathname();
  const isSystemBooted = useAppStore((state) => state.isSystemBooted);
  const isSummaryMode  = useAppStore((state) => state.isSummaryMode);

  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0));
  const desiredPos = useRef(new THREE.Vector3());
  const desiredLook = useRef(new THREE.Vector3());
  const radial = useRef(new THREE.Vector3());

  // 🔍 Mutable scroll-wheel zoom accumulator (clamped). Positive = zoomed out.
  const zoomOffset       = useRef(0);
  const lastPinchDist    = useRef<number | null>(null);
  const lastMoveSoundAt  = useRef(0);          // throttle: ms timestamp of last move sfx
  const prevPathnameRef  = useRef<string | null>(null); // detect real navigation vs boot
  // Mirrors so event listeners read the current value without re-binding.
  const pathnameRef      = useRef(pathname);
  const summaryModeRef   = useRef(isSummaryMode);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);
  useEffect(() => { summaryModeRef.current = isSummaryMode; }, [isSummaryMode]);

  // GSAP warp helper for STATIC routes — applies zoomOffset along the away-vector
  const applyStaticWarp = useCallback((duration = 1.2) => {
    const path = pathnameRef.current;
    if (getPlanetRoute(path)) return;
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
    // Play move sfx on actual navigation (skip very first boot mount)
    if (prevPathnameRef.current !== null && prevPathnameRef.current !== pathname) {
      audioManager.playSfx('move', 0.3);
    }
    prevPathnameRef.current = pathname;
    // Each new sector starts at its curated framing
    zoomOffset.current = 0;

    if (getPlanetRoute(pathname)) {
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
      if (summaryModeRef.current || pathnameRef.current.startsWith('/admin')) return;
      zoomOffset.current = THREE.MathUtils.clamp(
        zoomOffset.current + e.deltaY * ZOOM_SENSITIVITY,
        ZOOM_MIN,
        ZOOM_MAX,
      );
      // Throttled move sfx (once per 500ms while scrolling)
      const now = performance.now();
      if (now - lastMoveSoundAt.current > 2000) {
        audioManager.playSfx('move', 0.2);
        lastMoveSoundAt.current = now;
      }
      // Static routes need their GSAP target re-pointed. Planet routes pick up the
      // new offset automatically in useFrame.
      if (!getPlanetRoute(pathnameRef.current)) {
        applyStaticWarp(0.45);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [isSystemBooted, applyStaticWarp]);

  // 👌 Pinch-to-zoom — two fingers spread/pinch → same zoomOffset as wheel
  useEffect(() => {
    if (!isSystemBooted) return;

    const getPinchDist = (e: TouchEvent) => {
      const t0 = e.touches[0], t1 = e.touches[1];
      return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) lastPinchDist.current = getPinchDist(e);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || lastPinchDist.current === null) return;
      if (summaryModeRef.current || pathnameRef.current.startsWith('/admin')) return;
      const dist = getPinchDist(e);
      // lastPinchDist - dist: positive when fingers close (pinch in = zoom out)
      const delta = lastPinchDist.current - dist;
      zoomOffset.current = THREE.MathUtils.clamp(
        zoomOffset.current + delta * PINCH_SENSITIVITY,
        ZOOM_MIN,
        ZOOM_MAX,
      );
      lastPinchDist.current = dist;
      // Throttled move sfx during pinch
      const now = performance.now();
      if (now - lastMoveSoundAt.current > 2000) {
        audioManager.playSfx('move', 0.2);
        lastMoveSoundAt.current = now;
      }
      if (!getPlanetRoute(pathnameRef.current)) applyStaticWarp(0.45);
    };

    const onTouchEnd = () => { lastPinchDist.current = null; };

    window.addEventListener('touchstart',  onTouchStart,  { passive: true });
    window.addEventListener('touchmove',   onTouchMove,   { passive: true });
    window.addEventListener('touchend',    onTouchEnd,    { passive: true });
    window.addEventListener('touchcancel', onTouchEnd,    { passive: true });
    return () => {
      window.removeEventListener('touchstart',  onTouchStart);
      window.removeEventListener('touchmove',   onTouchMove);
      window.removeEventListener('touchend',    onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isSystemBooted, applyStaticWarp]);

  // 🛰️ Per-frame dynamic follow for orbiting planet routes + lookAt application.
  useFrame((_, delta) => {
    if (!isSystemBooted) return;

    const planetRoute = getPlanetRoute(pathname);
    if (planetRoute) {
      const p = planetPositions[planetRoute];
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