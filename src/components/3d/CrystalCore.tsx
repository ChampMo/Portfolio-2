'use client';

import { useRef, useState, useEffect } from 'react';
// import { Preload, useTexture } from '@react-three/drei'; //Retracted Preload useTexture for now, assume undefined is gone
import { Float, MeshTransmissionMaterial, Billboard, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useRouter, usePathname } from 'next/navigation';
import type { ThreeEvent } from '@react-three/fiber';
import { useAppStore } from '@/lib/store/useAppStore';

// Route at which the camera is locked onto the core. Only when we're already
// here does a click on the mesh open the About Data Slate — otherwise the click
// merely warps the camera to focus.
const CORE_FOCUS_PATH = '/about';

export default function CrystalCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const toggleSummaryMode = useAppStore((state) => state.toggleSummaryMode);
  const router = useRouter();
  const pathname = usePathname();
  const isFocused = pathname === CORE_FOCUS_PATH;

  // State มารับรูปภาพแทน useTexture ที่ Turbopack มีปัญหา undefined
  const [myPicture, setMyPicture] = useState<THREE.Texture | null>(null);

  // Holds the currently-running spin tween so we don't queue overlapping spins
  const spinTween = useRef<gsap.core.Tween | null>(null);

  useCursor(hovered);

  // 🌀 Hover: fire ONE 360° rotation tween. No constant rotation, no snap-back.
  const handlePointerOver = () => {
    setHovered(true);
    const mesh = meshRef.current;
    if (!mesh) return;
    if (spinTween.current && spinTween.current.isActive()) return;
    const target = mesh.rotation.y + Math.PI * 2;
    spinTween.current = gsap.to(mesh.rotation, {
      y: target,
      duration: 1.4,
      ease: 'power2.out',
    });
  };

  const handlePointerOut = () => setHovered(false);

  // 🎯 Gated click: only opens the slate once the camera is locked on the core.
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
      '/textures/core_img.png', // ไฟล์ของคุณ
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace; // บังคับให้สีรูปสดใส ไม่ซีดจาง
        setMyPicture(texture);
      },
      undefined,
      (err) => console.error("Texture Load Error:", err)
    );
  }, []);

  return (
    // Float ทำให้คริสตัลลอยขึ้น-ลง เหมือนอยู่ในสภาวะไร้แรงโน้มถ่วง
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1.5}>
      
      {/* 1. เปลือกนอก: คริสตัลใส - ปรับขนาด radius ลดลง */}
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
          roughness={0.02} // คงความใสต่ำเหมือนเดิม
          transmission={1}
          ior={1.1}          // ลด IOR ลงนิดนึงเพื่อให้ภาพด้านในไม่เพี้ยนมากเกินไป
          chromaticAberration={0.2}
          anisotropy={0.3}
          depthWrite={true} // 🌟 1. 👇 กำหนด depthWrite เป็น true เสมอสำหรับ Crystal Material ป้องกัน disappearance on hover
          color={hovered ? "#e7d0ff" : "#e2c6ff"} // สีพื้นฐานดึงให้จางลงเล็กน้อย
          clearcoat={1} // เพิ่ม clearcoat เพื่อให้คริสตัลดูเงางามขึ้น
        />
      </mesh>

      {/* 3. 👇 แกนพลังงานด้านใน (The Soul) - เปลี่ยนจากทรงกลมเป็นรูปภาพ */}
      {/* Billboard จะทำให้ Object หันหน้าเข้าหากล้องตลอดเวลา 
        ทำให้รูปคุณไม่กลายเป็นแผ่นบางๆ เวลาหมุนมุมกล้อง
      */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false} // lock ทั้งหมดเป็น false เพื่อให้หันตามอิสระทุกแกน
        position={[0, 0, 0]} // วางไว้ตรงกลางเป๊ะ
      >
        {/* 🌟 2. 👇 ลดอัตราส่วนการขยายขนาดรูปภาพด้านใน */}
        <mesh scale={hovered ? 2 : 1.8}> {/* ลดสเกลจาก 1.6:1.4 เป็น 1.3:1.1 */}
          {/* สร้างแผ่นสี่เหลี่ยมมารับรูปภาพ (args: [width, height]) */}
          <planeGeometry args={[1, 1]} /> 
          
          {/* แปะรูปลงไปในวัสดุ */}
          {myPicture ? (
            <meshBasicMaterial 
              map={myPicture} 
              transparent={true} 
              side={THREE.DoubleSide} 
              depthWrite={true} // 🌟 1. 👇 แก้จาก depthWrite={false} เป็น depthWrite={true} ป้องกัน disappearance on hover
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