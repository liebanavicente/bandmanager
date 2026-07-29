"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const BASE_TILT = -1.05;

function VinylMesh() {
  const group = useRef<THREE.Group>(null);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    if (!reducedMotion.current) {
      g.rotation.z += delta * 0.55;
      g.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
    }
    // Parallax sutil al cursor alrededor de la inclinación base
    const { x, y } = state.pointer;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, BASE_TILT + y * 0.2, 0.06);
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, x * 0.3, 0.06);
  });

  return (
    <group ref={group} rotation={[BASE_TILT, 0, 0]}>
      {/* Disco */}
      <mesh>
        <cylinderGeometry args={[1.55, 1.55, 0.09, 72]} />
        <meshStandardMaterial color="#101010" roughness={0.32} metalness={0.6} />
      </mesh>
      {/* Surcos */}
      {[1.32, 1.12, 0.92, 0.76].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <torusGeometry args={[r, 0.008, 8, 72]} />
          <meshStandardMaterial color="#3d3d3d" roughness={0.5} />
        </mesh>
      ))}
      {/* Aro ácido de identidad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.052, 0]}>
        <torusGeometry args={[0.62, 0.014, 8, 64]} />
        <meshStandardMaterial color="#E8FF32" emissive="#E8FF32" emissiveIntensity={0.35} />
      </mesh>
      {/* Etiqueta roja */}
      <mesh position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.52, 0.52, 0.03, 48]} />
        <meshStandardMaterial color="#E32620" roughness={0.65} />
      </mesh>
      {/* Agujero */}
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 24]} />
        <meshStandardMaterial color="#F2EBDD" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Escena 3D ligera: vinilo procedural con foco rojo. Sin modelos externos. */
export default function VinylScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.1, 4.1], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.5} />
      {/* Foco rojo backstage */}
      <pointLight position={[3, 2.5, 3.5]} intensity={55} color="#E32620" />
      {/* Relleno de papel para perfilar el disco */}
      <pointLight position={[-3.5, 1.5, 4]} intensity={22} color="#F2EBDD" />
      {/* Toque ácido inferior */}
      <pointLight position={[0, -3, 2.5]} intensity={8} color="#E8FF32" />
      <directionalLight position={[0, 4, 3]} intensity={0.5} color="#F2EBDD" />
      <VinylMesh />
    </Canvas>
  );
}
