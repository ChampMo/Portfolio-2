// ไฟล์: src/lib/3d/planetPositions.ts
// 🛰️ Shared registry: Planet writes its live world position here per frame,
// CameraRig reads it to keep the lookAt locked onto the moving target.
import * as THREE from 'three';

export const planetPositions: Record<string, THREE.Vector3> = {};
