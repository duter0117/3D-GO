'use client';
// ==============================
// 3D Go Game — Stones (Light Theme)
// ==============================

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { Position } from '../../engine/types';

const STONE_RADIUS = 0.35;

export function Stones() {
  const board = useGameStore((s) => s.board);
  const boardSize = useGameStore((s) => s.boardSize);
  const pendingMoves = useGameStore((s) => s.pendingMoves);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const showSlice = useGameStore((s) => s.showSlice);
  const sliceAxis = useGameStore((s) => s.sliceAxis);
  const sliceIndex = useGameStore((s) => s.sliceIndex);

  const placed: { pos: Position; color: 'black' | 'white' }[] = [];
  const pending: { pos: Position; color: 'black' | 'white' }[] = [];

  for (let x = 0; x < boardSize; x++) {
    for (let y = 0; y < boardSize; y++) {
      for (let z = 0; z < boardSize; z++) {
        const cell = board[x][y][z];
        if (cell) placed.push({ pos: { x, y, z }, color: cell });
      }
    }
  }
  for (const pos of pendingMoves) {
    pending.push({ pos, color: currentPlayer });
  }

  return (
    <group>
      {placed.map((s) => (
        <PlacedStone
          key={`${s.pos.x},${s.pos.y},${s.pos.z}`}
          position={s.pos}
          color={s.color}
          showSlice={showSlice}
          sliceAxis={sliceAxis}
          sliceIndex={sliceIndex}
        />
      ))}
      {pending.map((s, i) => (
        <PendingStone
          key={`pending-${i}`}
          position={s.pos}
          color={s.color}
          showSlice={showSlice}
          sliceAxis={sliceAxis}
          sliceIndex={sliceIndex}
        />
      ))}
    </group>
  );
}

function getSliceInfo(pos: Position, showSlice: boolean, sliceAxis: string, sliceIndex: number) {
  if (!showSlice) return { onSlice: false, opacity: 1, scale: 1 };
  const val = sliceAxis === 'x' ? pos.x : sliceAxis === 'y' ? pos.y : pos.z;
  const dist = Math.abs(val - sliceIndex);
  if (dist === 0) return { onSlice: true, opacity: 1, scale: 1 };
  if (dist === 1) return { onSlice: false, opacity: 0.2, scale: 0.75 };
  return { onSlice: false, opacity: 0.05, scale: 0.5 };
}

/** 已落的棋子 */
function PlacedStone({
  position,
  color,
  showSlice,
  sliceAxis,
  sliceIndex,
}: {
  position: Position;
  color: 'black' | 'white';
  showSlice: boolean;
  sliceAxis: string;
  sliceIndex: number;
}) {
  const { onSlice, opacity, scale } = getSliceInfo(position, showSlice, sliceAxis, sliceIndex);

  // 淺色背景：黑子深色實心，白子淺色
  const baseColor = color === 'black' ? '#1a1a2e' : '#f0f0f5';
  const baseEmissive = color === 'black' ? '#112266' : '#8888aa';
  const baseEmissiveIntensity = color === 'black' ? 0.2 : 0.05;

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh scale={scale}>
        <sphereGeometry args={[STONE_RADIUS, 24, 24]} />
        <meshPhysicalMaterial
          color={baseColor}
          emissive={baseEmissive}
          emissiveIntensity={baseEmissiveIntensity}
          metalness={color === 'black' ? 0.3 : 0.05}
          roughness={color === 'black' ? 0.3 : 0.15}
          transparent
          opacity={opacity}
          clearcoat={1}
          clearcoatRoughness={0.1}
          depthWrite={opacity > 0.5}
        />
      </mesh>

      {/* 切片淡綠光暈 */}
      {onSlice && (
        <>
          <mesh scale={scale}>
            <sphereGeometry args={[STONE_RADIUS * 1.4, 16, 16]} />
            <meshBasicMaterial
              color="#00cc66"
              transparent
              opacity={0.08}
              depthWrite={false}
              side={THREE.BackSide}
            />
          </mesh>
          <mesh scale={scale}>
            <sphereGeometry args={[STONE_RADIUS * 2.0, 12, 12]} />
            <meshBasicMaterial
              color="#00cc66"
              transparent
              opacity={0.03}
              depthWrite={false}
              side={THREE.BackSide}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

/** 待定落子（脈動發光） */
function PendingStone({
  position,
  color,
  showSlice,
  sliceAxis,
  sliceIndex,
}: {
  position: Position;
  color: 'black' | 'white';
  showSlice: boolean;
  sliceAxis: string;
  sliceIndex: number;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const { onSlice } = getSliceInfo(position, showSlice, sliceAxis, sliceIndex);

  useFrame(({ clock }) => {
    if (matRef.current) {
      const pulse = Math.sin(clock.getElapsedTime() * 3) * 0.3 + 0.7;
      matRef.current.emissiveIntensity = pulse * 0.6;
      matRef.current.opacity = 0.5 + pulse * 0.3;
    }
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh>
        <sphereGeometry args={[STONE_RADIUS, 24, 24]} />
        <meshStandardMaterial
          ref={matRef}
          color={color === 'black' ? '#2a2a4e' : '#e8e8f8'}
          emissive={color === 'black' ? '#3355cc' : '#8888cc'}
          emissiveIntensity={0.5}
          transparent
          opacity={0.7}
        />
      </mesh>

      {onSlice && (
        <mesh>
          <sphereGeometry args={[STONE_RADIUS * 1.4, 16, 16]} />
          <meshBasicMaterial
            color="#00cc66"
            transparent
            opacity={0.06}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
}
