'use client';
// ==============================
// 3D Go Game — Main Canvas
// ==============================

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Board3D } from './Board3D';
import { Stones } from './Stones';
import { GridPoints } from './GridPoints';
import { SlicePlane } from './SlicePlane';
import { CoordinateAxes } from './CoordinateAxes';
import { ConnectionLines } from './ConnectionLines';
import { useGameStore } from '../../store/gameStore';

export function GameCanvas() {
  const boardSize = useGameStore((s) => s.boardSize);
  const center = (boardSize - 1) / 2;

  return (
    <Canvas
      camera={{
        position: [boardSize * 1.5, boardSize * 1.2, boardSize * 1.5],
        fov: 45,
        near: 0.1,
        far: 200,
      }}
      style={{ background: '#e8ecf4' }}
      gl={{ antialias: true, alpha: false }}
    >
      {/* 環境光 — 亮色場景 */}
      <ambientLight intensity={0.8} color="#ffffff" />
      <directionalLight position={[10, 15, 10]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-5, 10, -8]} intensity={0.5} color="#dde0ff" />
      <pointLight position={[center, boardSize * 2, center]} intensity={0.4} color="#aabbff" />

      {/* 場景中心偏移到原點 */}
      <group position={[-center, -center, -center]}>
        <Board3D />
        <Stones />
        <GridPoints />
        <SlicePlane />
        <CoordinateAxes size={boardSize} />
        <ConnectionLines />
      </group>

      {/* 旋轉控制 */}
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={boardSize * 4}
        makeDefault
      />
    </Canvas>
  );
}
