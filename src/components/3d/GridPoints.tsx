'use client';
// ==============================
// 3D Go Game — Clickable Grid Points (Light Theme)
// ==============================

import { useMemo, useState, useCallback } from 'react';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';
import { Position } from '../../engine/types';

const POINT_RADIUS = 0.08;
const HITBOX_RADIUS = 0.4;

export function GridPoints() {
  const boardSize = useGameStore((s) => s.boardSize);
  const board = useGameStore((s) => s.board);
  const showSlice = useGameStore((s) => s.showSlice);
  const sliceAxis = useGameStore((s) => s.sliceAxis);
  const sliceIndex = useGameStore((s) => s.sliceIndex);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const selectPosition = useGameStore((s) => s.selectPosition);
  const setHoveredPosition = useGameStore((s) => s.setHoveredPosition);

  const [hovered, setHovered] = useState<string | null>(null);

  const emptyPoints = useMemo(() => {
    const points: Position[] = [];
    for (let x = 0; x < boardSize; x++) {
      for (let y = 0; y < boardSize; y++) {
        for (let z = 0; z < boardSize; z++) {
          if (board[x][y][z] === null) {
            points.push({ x, y, z });
          }
        }
      }
    }
    return points;
  }, [board, boardSize]);

  const handleClick = useCallback(
    (pos: Position) => {
      selectPosition(pos);
    },
    [selectPosition]
  );

  const handlePointerEnter = useCallback(
    (pos: Position) => {
      const key = `${pos.x},${pos.y},${pos.z}`;
      setHovered(key);
      setHoveredPosition(pos);
    },
    [setHoveredPosition]
  );

  const handlePointerLeave = useCallback(() => {
    setHovered(null);
    setHoveredPosition(null);
  }, [setHoveredPosition]);

  return (
    <group>
      {emptyPoints.map((pos) => {
        const key = `${pos.x},${pos.y},${pos.z}`;
        const isHovered = hovered === key;
        const sliceVal =
          sliceAxis === 'x' ? pos.x : sliceAxis === 'y' ? pos.y : pos.z;
        const onSlice = !showSlice || sliceVal === sliceIndex;
        const dist = showSlice ? Math.abs(sliceVal - sliceIndex) : 0;

        // 切片模式：只顯示附近層的格點圓點
        if (showSlice && dist > 1) return null;

        // ★ 切片模式下只有當前切面的點可以互動
        const interactive = !showSlice || sliceVal === sliceIndex;

        const pointColor = isHovered && interactive ? '#5566cc' : '#8899bb';
        const pointOpacity = onSlice ? 0.6 : 0.1;

        return (
          <group key={key} position={[pos.x, pos.y, pos.z]}>
            {/* 小圓點 */}
            <mesh>
              <sphereGeometry args={[POINT_RADIUS, 8, 8]} />
              <meshBasicMaterial
                color={pointColor}
                transparent
                opacity={pointOpacity}
              />
            </mesh>

            {/* 切片淡綠光暈 */}
            {showSlice && onSlice && (
              <mesh>
                <sphereGeometry args={[POINT_RADIUS * 4, 8, 8]} />
                <meshBasicMaterial
                  color="#00cc66"
                  transparent
                  opacity={0.05}
                  depthWrite={false}
                />
              </mesh>
            )}

            {/* ★ 隱形 hitbox — 切片模式下只有當前切面可點 */}
            {interactive && (
              <mesh
                visible={false}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick(pos);
                }}
                onPointerEnter={(e) => {
                  e.stopPropagation();
                  handlePointerEnter(pos);
                }}
                onPointerLeave={handlePointerLeave}
              >
                <sphereGeometry args={[HITBOX_RADIUS, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>
            )}

            {/* Hover 預覽 + 座標 */}
            {isHovered && interactive && (
              <>
                <mesh>
                  <sphereGeometry args={[0.3, 16, 16]} />
                  <meshStandardMaterial
                    color={currentPlayer === 'black' ? '#2a2a4e' : '#e8e8f0'}
                    transparent
                    opacity={0.35}
                    emissive={currentPlayer === 'black' ? '#3355cc' : '#8888cc'}
                    emissiveIntensity={0.3}
                  />
                </mesh>

                <Html
                  center
                  distanceFactor={12}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                  position={[0, 0.7, 0]}
                >
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(80, 100, 180, 0.3)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      color: '#334',
                      fontSize: '12px',
                      fontFamily: "'JetBrains Mono', monospace",
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    ({pos.x}, {pos.y}, {pos.z})
                  </div>
                </Html>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}
