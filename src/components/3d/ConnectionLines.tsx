'use client';
// ==============================
// 3D Go Game — Connection Lines (Electric Current)
// ==============================

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { Position } from '../../engine/types';

// 只檢查正方向避免重複線段
const HALF_DIRS: Position[] = [
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: 0, z: 1 },
];

interface Connection {
  from: Position;
  to: Position;
  sameColor: boolean;
  isPending: boolean;
}

export function ConnectionLines() {
  const board = useGameStore((s) => s.board);
  const boardSize = useGameStore((s) => s.boardSize);
  const pendingMoves = useGameStore((s) => s.pendingMoves);
  const currentPlayer = useGameStore((s) => s.currentPlayer);

  // 收集所有連接
  const connections = useMemo(() => {
    const conns: Connection[] = [];
    const pendingSet = new Set(pendingMoves.map((p) => `${p.x},${p.y},${p.z}`));

    // 建立包含 pending 的合併棋盤
    const combined: (string | null)[][][] = [];
    for (let x = 0; x < boardSize; x++) {
      combined[x] = [];
      for (let y = 0; y < boardSize; y++) {
        combined[x][y] = [];
        for (let z = 0; z < boardSize; z++) {
          combined[x][y][z] = board[x][y][z];
        }
      }
    }
    for (const pos of pendingMoves) {
      combined[pos.x][pos.y][pos.z] = currentPlayer;
    }

    for (let x = 0; x < boardSize; x++) {
      for (let y = 0; y < boardSize; y++) {
        for (let z = 0; z < boardSize; z++) {
          const cell = combined[x][y][z];
          if (!cell) continue;

          for (const dir of HALF_DIRS) {
            const nx = x + dir.x;
            const ny = y + dir.y;
            const nz = z + dir.z;
            if (nx >= boardSize || ny >= boardSize || nz >= boardSize) continue;

            const neighbor = combined[nx][ny][nz];
            if (!neighbor) continue;

            const fromKey = `${x},${y},${z}`;
            const toKey = `${nx},${ny},${nz}`;
            const isPending = pendingSet.has(fromKey) || pendingSet.has(toKey);

            conns.push({
              from: { x, y, z },
              to: { x: nx, y: ny, z: nz },
              sameColor: cell === neighbor,
              isPending,
            });
          }
        }
      }
    }
    return conns;
  }, [board, boardSize, pendingMoves, currentPlayer]);

  // 分成 4 組幾何
  const geometries = useMemo(() => {
    const groups = {
      blueSolid: [] as THREE.Vector3[],
      redSolid: [] as THREE.Vector3[],
      bluePending: [] as THREE.Vector3[],
      redPending: [] as THREE.Vector3[],
    };

    for (const conn of connections) {
      const from = new THREE.Vector3(conn.from.x, conn.from.y, conn.from.z);
      const to = new THREE.Vector3(conn.to.x, conn.to.y, conn.to.z);

      if (conn.sameColor) {
        if (conn.isPending) {
          groups.bluePending.push(from, to);
        } else {
          groups.blueSolid.push(from, to);
        }
      } else {
        if (conn.isPending) {
          groups.redPending.push(from, to);
        } else {
          groups.redSolid.push(from, to);
        }
      }
    }

    const makeGeo = (pts: THREE.Vector3[]) => {
      if (pts.length === 0) return null;
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      // computeLineDistances 讓 LineDashedMaterial 生效
      const positions = geo.attributes.position;
      const distances = new Float32Array(positions.count);
      for (let i = 0; i < positions.count; i += 2) {
        const a = new THREE.Vector3().fromBufferAttribute(positions, i);
        const b = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
        distances[i] = 0;
        distances[i + 1] = a.distanceTo(b);
      }
      geo.setAttribute('lineDistance', new THREE.BufferAttribute(distances, 1));
      return geo;
    };

    return {
      blueSolid: makeGeo(groups.blueSolid),
      redSolid: makeGeo(groups.redSolid),
      bluePending: makeGeo(groups.bluePending),
      redPending: makeGeo(groups.redPending),
    };
  }, [connections]);

  // 動畫 refs
  const blueSolidMatRef = useRef<THREE.LineDashedMaterial>(null);
  const redSolidMatRef = useRef<THREE.LineDashedMaterial>(null);
  const bluePendingMatRef = useRef<THREE.LineDashedMaterial>(null);
  const redPendingMatRef = useRef<THREE.LineDashedMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 電流流動效果：dashOffset 動畫 + 閃爍 opacity
    const flow = t * 0.8;
    const flicker = 0.5 + Math.sin(t * 8) * 0.15 + Math.sin(t * 13) * 0.1;
    const flickerPending = 0.3 + Math.sin(t * 6) * 0.1 + Math.sin(t * 11) * 0.08;

    if (blueSolidMatRef.current) {
      blueSolidMatRef.current.dashOffset = -flow;
      blueSolidMatRef.current.opacity = flicker;
    }
    if (redSolidMatRef.current) {
      redSolidMatRef.current.dashOffset = -flow;
      redSolidMatRef.current.opacity = flicker;
    }
    if (bluePendingMatRef.current) {
      bluePendingMatRef.current.dashOffset = -flow * 1.3;
      bluePendingMatRef.current.opacity = flickerPending;
    }
    if (redPendingMatRef.current) {
      redPendingMatRef.current.dashOffset = -flow * 1.3;
      redPendingMatRef.current.opacity = flickerPending;
    }
  });

  return (
    <group>
      {/* 同色連接 — 藍色電流 */}
      {geometries.blueSolid && (
        <lineSegments geometry={geometries.blueSolid}>
          <lineDashedMaterial
            ref={blueSolidMatRef}
            color="#4488ff"
            dashSize={0.12}
            gapSize={0.08}
            transparent
            opacity={0.6}
            linewidth={1}
          />
        </lineSegments>
      )}

      {/* 異色連接 — 紅色電流 */}
      {geometries.redSolid && (
        <lineSegments geometry={geometries.redSolid}>
          <lineDashedMaterial
            ref={redSolidMatRef}
            color="#ff4444"
            dashSize={0.12}
            gapSize={0.08}
            transparent
            opacity={0.6}
            linewidth={1}
          />
        </lineSegments>
      )}

      {/* Pending 同色 — 淡藍色電流 */}
      {geometries.bluePending && (
        <lineSegments geometry={geometries.bluePending}>
          <lineDashedMaterial
            ref={bluePendingMatRef}
            color="#88bbff"
            dashSize={0.1}
            gapSize={0.1}
            transparent
            opacity={0.35}
            linewidth={1}
          />
        </lineSegments>
      )}

      {/* Pending 異色 — 淡紅色電流 */}
      {geometries.redPending && (
        <lineSegments geometry={geometries.redPending}>
          <lineDashedMaterial
            ref={redPendingMatRef}
            color="#ff8888"
            dashSize={0.1}
            gapSize={0.1}
            transparent
            opacity={0.35}
            linewidth={1}
          />
        </lineSegments>
      )}
    </group>
  );
}
