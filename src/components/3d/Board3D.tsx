'use client';
// ==============================
// 3D Go Game — Board Wireframe (Light Theme)
// ==============================

import { useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

export function Board3D() {
  const boardSize = useGameStore((s) => s.boardSize);
  const showSlice = useGameStore((s) => s.showSlice);

  const { edgeGeometry, gridGeometry } = useMemo(() => {
    const edgePoints: THREE.Vector3[] = [];
    const gridPoints: THREE.Vector3[] = [];
    const max = boardSize - 1;

    // 立方體邊框（12條邊）
    const corners = [
      [0, 0, 0], [max, 0, 0], [max, max, 0], [0, max, 0],
      [0, 0, max], [max, 0, max], [max, max, max], [0, max, max],
    ];
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];
    for (const [a, b] of edges) {
      edgePoints.push(new THREE.Vector3(...corners[a] as [number, number, number]));
      edgePoints.push(new THREE.Vector3(...corners[b] as [number, number, number]));
    }

    // 內部格線
    for (let axis = 0; axis < 3; axis++) {
      for (let i = 0; i <= max; i++) {
        for (let j = 0; j <= max; j++) {
          const start = [0, 0, 0];
          const end = [0, 0, 0];
          const otherAxes = [0, 1, 2].filter((a) => a !== axis);

          start[otherAxes[0]] = i;
          start[otherAxes[1]] = j;
          start[axis] = 0;

          end[otherAxes[0]] = i;
          end[otherAxes[1]] = j;
          end[axis] = max;

          gridPoints.push(new THREE.Vector3(start[0], start[1], start[2]));
          gridPoints.push(new THREE.Vector3(end[0], end[1], end[2]));
        }
      }
    }

    const edgeGeo = new THREE.BufferGeometry().setFromPoints(edgePoints);
    const gridGeo = new THREE.BufferGeometry().setFromPoints(gridPoints);

    return { edgeGeometry: edgeGeo, gridGeometry: gridGeo };
  }, [boardSize]);

  const gridOpacity = showSlice ? 0.06 : 0.12;

  return (
    <group>
      {/* 立方體邊框 */}
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color="#5566aa" opacity={0.5} transparent linewidth={1} />
      </lineSegments>

      {/* 內部格線 */}
      <lineSegments geometry={gridGeometry}>
        <lineBasicMaterial color="#8899bb" opacity={gridOpacity} transparent linewidth={1} />
      </lineSegments>

      {/* 底部地面 */}
      <mesh position={[(boardSize - 1) / 2, -0.5, (boardSize - 1) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[boardSize + 2, boardSize + 2]} />
        <meshStandardMaterial
          color="#d0d4e0"
          metalness={0.1}
          roughness={0.6}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}
