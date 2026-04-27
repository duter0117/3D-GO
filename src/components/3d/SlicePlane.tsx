'use client';
// ==============================
// 3D Go Game — Slice Plane
// ==============================

import { useGameStore } from '../../store/gameStore';

export function SlicePlane() {
  const boardSize = useGameStore((s) => s.boardSize);
  const showSlice = useGameStore((s) => s.showSlice);
  const sliceAxis = useGameStore((s) => s.sliceAxis);
  const sliceIndex = useGameStore((s) => s.sliceIndex);

  if (!showSlice) return null;

  const max = boardSize - 1;
  const center = max / 2;
  const planeSize = boardSize + 0.5;

  // 根據切片軸計算平面位置與旋轉
  let position: [number, number, number] = [center, center, center];
  let rotation: [number, number, number] = [0, 0, 0];

  switch (sliceAxis) {
    case 'x':
      position = [sliceIndex, center, center];
      rotation = [0, 0, Math.PI / 2];
      break;
    case 'y':
      position = [center, sliceIndex, center];
      rotation = [Math.PI / 2, 0, 0];
      break;
    case 'z':
      position = [center, center, sliceIndex];
      rotation = [0, 0, 0];
      break;
  }

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[planeSize, planeSize]} />
      <meshBasicMaterial
        color="#3355aa"
        transparent
        opacity={0.05}
        side={2}
        depthWrite={false}
      />
    </mesh>
  );
}
