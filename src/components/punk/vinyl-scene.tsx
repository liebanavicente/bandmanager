"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

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
      g.rotation.z += delta * 0.5;
      g.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
    }
    // Parallax sutil al cursor (también funciona en táctil como reposo)
    const { x, y } = state.pointer;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -0.45 + y * 0.25, 0.06);
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, x * 0.35, 0.06);
  });

  return (
    <group ref={group} rotation={[-0.45, 0, 0]}>
      {/* Disco */}
      <mesh>
        <cylinderGeometry args={[1.6, 1.6, 0.06, 72]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.35} metalness={0.55} />
      </mesh>
      {/* Surcos */}
      {[1.35, 1.15, 0.95, 0.78].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
          <torusGeometry args={[r, 0.006, 8, 72]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
        </mesh>
      ))}
      {/* Etiqueta roja */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.02, 48]} />
        <meshStandardMaterial color="#E32620" roughness={0.7} />
      </mesh>
      {/* Agujero */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.03, 24]} />
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
      camera={{ position: [0, 0.4, 4.4], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.35} />
      {/* Foco rojo backstage */}
      <pointLight position={[3, 2.5, 4]} intensity={42} color="#E32620" />
      {/* Relleno ácido muy tenue */}
      <pointLight position={[-3.5, -2, 3]} intensity={9} color="#E8FF32" />
      <directionalLight position={[0, 3, 5]} intensity={0.5} color="#F2EBDD" />
      <VinylMesh />
    </Canvas>
  );
}
