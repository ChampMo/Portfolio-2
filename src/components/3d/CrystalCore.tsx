'use client';

import { useRef, useState, useEffect } from 'react';
import { Float, MeshTransmissionMaterial, Billboard, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useRouter, usePathname } from 'next/navigation';
// 🌟 เพิ่ม useFrame เข้ามาจาก @react-three/fiber
import { useFrame, type ThreeEvent } from '@react-three/fiber'; 
import { useAppStore } from '@/lib/store/useAppStore';

const CORE_FOCUS_PATH = '/about';

export default function CrystalCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const idleRef = useRef<THREE.Group>(null); // 🌟 เพิ่ม Ref สำหรับควบคุมการหมุนตอนปกติ
  const [hovered, setHovered] = useState(false);
  const toggleSummaryMode = useAppStore((state) => state.toggleSummaryMode);
  const router = useRouter();
  const pathname = usePathname();
  const isFocused = pathname === CORE_FOCUS_PATH;

  const [myPicture, setMyPicture] = useState<THREE.Texture | null>(null);
  const spinTween = useRef<gsap.core.Tween | null>(null);

  useCursor(hovered);

  // 🔄 1. ตอนปกติ: สั่งให้กลุ่มคริสตัลหมุนช้าๆ ไปเรื่อยๆ 
  useFrame((_, delta) => {
    if (idleRef.current) {
      // delta คือเวลาที่ใช้ในแต่ละเฟรม คูณด้วยความเร็ว (0.2 กำลังหมุนเอื่อยๆ สวยงามครับ)
      idleRef.current.rotation.y += delta * 0.2; 
    }
  });

  // 🌀 2. ตอน Hover: สั่งให้ตัว Mesh ด้านในหมุนเพิ่มอีก "ครึ่งรอบ" (Math.PI)
  const handlePointerOver = () => {
    setHovered(true);
    const mesh = meshRef.current;
    if (!mesh) return;
    if (spinTween.current && spinTween.current.isActive()) return;
    
    // เปลี่ยนจาก Math.PI * 2 (1 รอบ) เป็น Math.PI (ครึ่งรอบ = 180 องศา)
    const target = mesh.rotation.y + Math.PI; 
    spinTween.current = gsap.to(mesh.rotation, {
      y: target,
      duration: 1.2, // ปรับความเร็วในการตวัดหมุนตรงนี้
      ease: 'power2.out',
    });
  };

  const handlePointerOut = () => setHovered(false);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isFocused) {
      toggleSummaryMode();
    } else {
      router.push(CORE_FOCUS_PATH);
    }
  };

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      '/textures/core_img.png',
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        setMyPicture(texture);
      },
      undefined,
      (err) => console.error("Texture Load Error:", err)
    );
  }, []);

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1.5}>
      
      {/* 🌟 ครอบด้วย group เพื่อแยก Layer สำหรับการหมุนสภาวะปกติ */}
      <group ref={idleRef}>
        {/* 1. เปลือกนอก: คริสตัลใส */}
        <mesh
          ref={meshRef}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <icosahedronGeometry args={[2.0, 0]} /> 
          
          <MeshTransmissionMaterial
            backside
            backsideThickness={1}
            thickness={0.5}
            roughness={0.02}
            transmission={1}
            ior={1.1}
            chromaticAberration={0.2}
            anisotropy={0.3}
            depthWrite={true}
            color={hovered ? "#e7d0ff" : "#e2c6ff"}
            clearcoat={1}
          />
        </mesh>
      </group>

      {/* 3. แกนพลังงานด้านใน (The Soul) ไม่ได้อยู่ใน group เพื่อไม่ให้หมุนตามเปลือกคริสตัล */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
        position={[0, 0, 0]}
      >
        <mesh scale={hovered ? 2 : 1.8}>
          <planeGeometry args={[1, 1]} /> 
          
          {myPicture ? (
            <meshBasicMaterial 
              map={myPicture} 
              transparent={true} 
              side={THREE.DoubleSide} 
              depthWrite={true}
              color={hovered ? "#ffffff" : "#d8b4fe"} 
            />
          ) : (
            <meshBasicMaterial color="#d8b4fe" wireframe={true} depthWrite={true} />
          )}
        </mesh>
      </Billboard>

    </Float>
  );
}