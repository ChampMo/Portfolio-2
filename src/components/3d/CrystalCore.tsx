'use client';

import { useRef, useState, useEffect } from 'react';
import { Float, MeshTransmissionMaterial, Billboard, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useRouter, usePathname } from 'next/navigation';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useAppStore } from '@/lib/store/useAppStore';

const CORE_FOCUS_PATH = '/about';

export default function CrystalCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const idleRef = useRef<THREE.Group>(null);
  const glowInnerRef = useRef<THREE.Mesh>(null);
  const glowOuterRef = useRef<THREE.Mesh>(null);
  const glowHaloRef = useRef<THREE.Mesh>(null); // 🌟 [ADDED]: เพิ่ม Ref สำหรับชั้นที่ 3
  const lightRef = useRef<THREE.PointLight>(null);
  
  const [hovered, setHovered] = useState(false);
  const [glowTexture, setGlowTexture] = useState<THREE.Texture | null>(null);
  const [myPicture, setMyPicture] = useState<THREE.Texture | null>(null);
  const [coreImageUrl, setCoreImageUrl] = useState<string | null>(null);
  
  const toggleSummaryMode = useAppStore((state) => state.toggleSummaryMode);
  const router = useRouter();
  const pathname = usePathname();
  const isFocused = pathname === CORE_FOCUS_PATH;
  const spinTween = useRef<gsap.core.Tween | null>(null);

  useCursor(hovered);

  useFrame((state, delta) => {
    if (idleRef.current) {
      idleRef.current.rotation.y += delta * 0.2;
    }
    const t = state.clock.elapsedTime;

    if (lightRef.current) {
      lightRef.current.intensity = (hovered ? 28 : 14) + Math.sin(t * 2.1) * 4;
    }
    
    // Animate glow opacity directly on material — no state re-render
    if (glowInnerRef.current) {
      (glowInnerRef.current.material as THREE.MeshBasicMaterial).opacity =
        (hovered ? 1.4 : 0.7) + Math.sin(t * 1.5) * 0.08;
    }
    if (glowOuterRef.current) {
      (glowOuterRef.current.material as THREE.MeshBasicMaterial).opacity =
        (hovered ? 0.6 : 0.4) + Math.sin(t * 0.8 + 1.2) * 0.05;
    }
    // 🌟 [ADDED]: อนิเมชันการเต้นของแสงชั้นที่ 3 (จางสุด เต้นช้าสุด)
    if (glowHaloRef.current) {
      (glowHaloRef.current.material as THREE.MeshBasicMaterial).opacity =
        (hovered ? 0.2 : 0.15) + Math.sin(t * 1 + 2.4) * 0.05;
    }
  });

  const handlePointerOver = () => {
    setHovered(true);
    const mesh = meshRef.current;
    if (!mesh) return;
    if (spinTween.current && spinTween.current.isActive()) return;
    spinTween.current = gsap.to(mesh.rotation, {
      y: mesh.rotation.y + Math.PI,
      duration: 1.2,
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
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const c = size / 2;
    const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(0,    'rgba(240, 171, 252, 1)');
    grad.addColorStop(0.25, 'rgba(192, 132, 252, 0.7)');
    grad.addColorStop(0.6,  'rgba(124,  58, 237, 0.2)');
    grad.addColorStop(1,    'rgba( 91,  33, 182, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    setGlowTexture(new THREE.CanvasTexture(canvas));
  }, []);

  useEffect(() => {
    fetch('/api/aboutme')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const url = d?.media?.coreImage;
        setCoreImageUrl(url || null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const url = coreImageUrl || '/textures/core_img.png';
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        setMyPicture(texture);
      },
      undefined,
      (err) => console.error('Texture Load Error:', err)
    );
  }, [coreImageUrl]);

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1.5}>

      {/* Lights */}
      <pointLight ref={lightRef} position={[0, 0, 0]} intensity={14} distance={20} color="#c084fc" />
      <pointLight position={[0, 0, 2]} intensity={4} distance={8} color="#818cf8" />
      <pointLight position={[0, 2, -1]} intensity={3} distance={7} color="#f0abfc" />

      {glowTexture && (
        <>
          <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
            <mesh ref={glowInnerRef} scale={9}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial
                map={glowTexture}
                transparent
                opacity={0.65}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </Billboard>

          <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
            <mesh ref={glowOuterRef} scale={16}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial
                map={glowTexture}
                transparent
                opacity={0.28}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </Billboard>

          {/* 🌟 [ADDED]: ชั้นที่ 3 ออร่าวงนอกสุด ปรับสเกลใหญ่เป็น 18 และเริ่มความสว่างที่ 0.12 */}
          <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
            <mesh ref={glowHaloRef} scale={26}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial
                map={glowTexture}
                transparent
                opacity={0.12}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </Billboard>
        </>
      )}

      {/* Crystal shell */}
      <group ref={idleRef}>
        <mesh
          ref={meshRef}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <icosahedronGeometry args={[4, 0]} />
          <MeshTransmissionMaterial
            backside
            backsideThickness={1}
            thickness={0.3}
            roughness={0.02}
            transmission={1}
            ior={1.5}
            chromaticAberration={0.1}
            anisotropy={0.3}
            depthWrite={true}
            color={hovered ? "#e7d0ff" : "#e2c6ff"}
            clearcoat={1}
          />
        </mesh>
      </group>

      {/* Profile picture */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false} position={[0, 0, 0.4]}>
        <mesh scale={hovered ? 4.2 : 3.9} renderOrder={5}>
          <planeGeometry args={[1, 1]} />
          {myPicture ? (
            <meshBasicMaterial
              map={myPicture}
              transparent={true}
              side={THREE.DoubleSide}
              depthWrite={false}
              color="#ffffff"
            />
          ) : (
            <meshBasicMaterial color="#d8b4fe" wireframe={true} depthWrite={false} />
          )}
        </mesh>
      </Billboard>

    </Float>
  );
}