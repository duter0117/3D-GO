'use client';
// ==============================
// 3D Go Game — Connection Lines (Electric Current via Cylinders)
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

const WIRE_RADIUS = 0.025;
const WIRE_SEGMENTS = 6;
const sharedCylGeo = new THREE.CylinderGeometry(WIRE_RADIUS, WIRE_RADIUS, 1, WIRE_SEGMENTS);
// 預設圓柱沿 Y 軸，旋轉到沿 Z 軸方便 lookAt
sharedCylGeo.rotateX(Math.PI / 2);

interface Conn {
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

  const connections = useMemo(() => {
    const conns: Conn[] = [];
    const pendingSet = new Set(pendingMoves.map((p) => `${p.x},${p.y},${p.z}`));

    // 合併棋盤
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

  // 分 4 組
  const groups = useMemo(() => {
    const result = {
      blueSolid: [] as Conn[],
      redSolid: [] as Conn[],
      bluePending: [] as Conn[],
      redPending: [] as Conn[],
    };
    for (const c of connections) {
      if (c.sameColor) {
        (c.isPending ? result.bluePending : result.blueSolid).push(c);
      } else {
        (c.isPending ? result.redPending : result.redSolid).push(c);
      }
    }
    return result;
  }, [connections]);

  return (
    <group>
      <WireGroup conns={groups.blueSolid} color="#4488ff" baseOpacity={0.55} speed={8} />
      <WireGroup conns={groups.redSolid} color="#ff4444" baseOpacity={0.55} speed={8} />
      <WireGroup conns={groups.bluePending} color="#88bbff" baseOpacity={0.3} speed={6} />
      <WireGroup conns={groups.redPending} color="#ff8888" baseOpacity={0.3} speed={6} />
    </group>
  );
}

const tempObj = new THREE.Object3D();
const tempVec = new THREE.Vector3();

function WireGroup({
  conns,
  color,
  baseOpacity,
  speed,
}: {
  conns: Conn[];
  color: string;
  baseOpacity: number;
  speed: number;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meshRef = useRef<any>(null);

  // 用 InstancedMesh 高效渲染所有同色線段
  const count = conns.length;

  // 設定每條線的 matrix
  useMemo(() => {
    if (!meshRef.current || count === 0) return;
    for (let i = 0; i < count; i++) {
      const c = conns[i];
      const from = new THREE.Vector3(c.from.x, c.from.y, c.from.z);
      const to = new THREE.Vector3(c.to.x, c.to.y, c.to.z);
      const mid = from.clone().add(to).multiplyScalar(0.5);
      const dist = from.distanceTo(to);

      tempObj.position.copy(mid);
      tempObj.lookAt(to);
      tempObj.scale.set(1, 1, dist);
      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conns, count, meshRef.current]);

  // 閃爍動畫
  useFrame(({ clock }) => {
    if (meshRef.current?.material) {
      const t = clock.getElapsedTime();
      const flicker = baseOpacity + Math.sin(t * speed) * 0.12 + Math.sin(t * speed * 1.6) * 0.08;
      meshRef.current.material.opacity = flicker;
    }
  });

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[sharedCylGeo, undefined, Math.max(count, 1)]} frustumCulled={false}>
      <meshBasicMaterial color={color} transparent opacity={baseOpacity} depthWrite={false} />
    </instancedMesh>
  );
}
