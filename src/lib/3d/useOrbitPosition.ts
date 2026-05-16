// ไฟล์: src/lib/3d/useOrbitPosition.ts
// 🛰️ Reusable orbital hook — returns a group ref that orbits the origin and
// publishes its live world position into the shared `planetPositions` registry
// so CameraRig can follow it.
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { planetPositions } from './planetPositions';

export interface OrbitParams {
  radiusX: number;
  radiusZ: number;
  speed: number;
  offset: number;
  centerY?: number;
  path: string;
}

export function useOrbitPosition(params: OrbitParams) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const x = Math.cos(t * params.speed + params.offset) * params.radiusX;
    const z = Math.sin(t * params.speed + params.offset) * params.radiusZ;
    const y = params.centerY ?? 0;

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
    }

    if (!planetPositions[params.path]) {
      planetPositions[params.path] = new THREE.Vector3();
    }
    planetPositions[params.path].set(x, y, z);
  });

  return groupRef;
}
