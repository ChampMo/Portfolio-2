// ไฟล์: src/components/3d/Planet.tsx
'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Torus, Text, MeshDistortMaterial, useCursor, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter } from 'next/navigation'; // 👈 นำเข้า useRouter สำหรับเปลี่ยนหน้า
import { planetPositions } from '@/lib/3d/planetPositions';
import { useAppStore } from '@/lib/store/useAppStore';

interface PlanetProps {
  // 🛰️ Orbital parameters (ellipse around origin on the y = centerY plane)
  radiusX: number;
  radiusZ: number;
  speed: number;
  offset: number;
  centerY?: number;
  color: string;
  label: string;
  path: string; // 👈 เพิ่ม Prop path เพื่อบอกว่าดาวดวงนี้คลิกแล้วไป URL ไหน
}

export default function Planet({
  radiusX,
  radiusZ,
  speed,
  offset,
  centerY = 0,
  color,
  label,
  path,
}: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const router = useRouter(); // 👈 เรียกใช้งานระบบนำทาง
  const setSummaryMode = useAppStore((s) => s.setSummaryMode); // 👈 เปิด Data Slate ตอนคลิกดาว

  useCursor(hovered);

  useFrame((state, delta) => {
    // 🪐 Orbital translation: x = cos(t·speed + offset) · radiusX,  z = sin(...) · radiusZ
    const t = state.clock.elapsedTime;
    const x = Math.cos(t * speed + offset) * radiusX;
    const z = Math.sin(t * speed + offset) * radiusZ;

    if (groupRef.current) {
      groupRef.current.position.set(x, centerY, z);
    }

    // 📡 Publish live position so CameraRig can follow this moving target
    if (!planetPositions[path]) planetPositions[path] = new THREE.Vector3();
    planetPositions[path].set(x, centerY, z);

    if (meshRef.current) meshRef.current.rotation.y += delta * 0.4;
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.2;
      ringRef.current.rotation.y += delta * 0.6;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. ตัวดวงดาว */}
      <Sphere 
        ref={meshRef}
        args={[1, 64, 64]} 
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => {
          router.push(path);   // 👈 เปลี่ยน URL ไป sector ของดาว
          setSummaryMode(true); // 👈 บังคับเปิด Data Slate ของ sector นั้นทันที
        }}
      >
        <MeshDistortMaterial 
          color={hovered ? "#ffffff" : color} 
          envMapIntensity={1} 
          clearcoat={1} 
          clearcoatRoughness={0.1} 
          metalness={0.7} 
          roughness={0.2}
          distort={hovered ? 0.2 : 0.35} // ตอน hover ให้ดาวนิ่งขึ้นเล็กน้อยเหมือนล็อกเป้าได้
          speed={2}
        />
      </Sphere>

      {/* 2. */}
      <Torus ref={ringRef} args={[2.2, 0.02, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.9 : 0.4} />
      </Torus>

      {/* 3. — Billboard */}
      <Billboard
        follow
        lockX={false}
        lockY={false}
        lockZ={false}
        position={[0, 2.5, 0]}
      >
        <Text
          fontSize={0.4}
          color={hovered ? "#ffffff" : color}
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