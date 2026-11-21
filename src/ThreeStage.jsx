import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { MathUtils } from 'three';

function InteractiveGrid() {
  const group = useRef(null);
  const target = useRef({ x: 0, z: 0 });
  const pointerTarget = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onPointerMove = (event) => {
      pointerTarget.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerTarget.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    target.current.x = pointerTarget.current.x * 0.5;
    target.current.z = pointerTarget.current.y * 0.3;
    group.current.position.x = MathUtils.damp(group.current.position.x, target.current.x, 1.5, delta);
    group.current.rotation.z = MathUtils.damp(group.current.rotation.z, -target.current.x * 0.012, 1.2, delta);
  });

  return <group ref={group} position={[0, -1.8, 0]}>
    <Grid
      args={[70, 70]}
      cellSize={0.8}
      cellThickness={0.45}
      cellColor="#222834"
      sectionSize={4}
      sectionThickness={0.65}
      sectionColor="#30394a"
      fadeDistance={24}
      fadeStrength={1.7}
      followCamera
      infiniteGrid
    />
  </group>;
}

export default function ThreeStage() {
  return <div className="three-stage" aria-hidden="true">
    <Canvas camera={{ position: [0, 3.5, 8], fov: 48 }} onCreated={({ camera }) => camera.lookAt(0, -1.8, 0)} dpr={[1, 1.35]} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}>
      <InteractiveGrid />
    </Canvas>
  </div>;
}
