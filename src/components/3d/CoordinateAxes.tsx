'use client';
// ==============================
// 3D Go Game — Coordinate Axes (slice-aware highlight)
// ==============================

import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';

interface AxesProps {
  size: number;
}

const AXES = [
  { axis: 'x' as const, color: '#cc3333', colorBright: '#ff4444', rgb: [0.8, 0.2, 0.2] },
  { axis: 'y' as const, color: '#22aa44', colorBright: '#33ff66', rgb: [0.13, 0.67, 0.27] },
  { axis: 'z' as const, color: '#3366cc', colorBright: '#4488ff', rgb: [0.2, 0.4, 0.8] },
] as const;

export function CoordinateAxes({ size }: AxesProps) {
  const max = size - 1;
  const extend = 1.2;
  const labelOffset = 0.6;
  const showSlice = useGameStore((s) => s.showSlice);
  const sliceAxis = useGameStore((s) => s.sliceAxis);
  const sliceIndex = useGameStore((s) => s.sliceIndex);

  // 每條軸獨立幾何
  const geos = useMemo(() => {
    const dirs: [THREE.Vector3, THREE.Vector3][] = [
      [new THREE.Vector3(-extend, 0, 0), new THREE.Vector3(max + extend, 0, 0)],
      [new THREE.Vector3(0, -extend, 0), new THREE.Vector3(0, max + extend, 0)],
      [new THREE.Vector3(0, 0, -extend), new THREE.Vector3(0, 0, max + extend)],
    ];
    return dirs.map(([a, b]) => new THREE.BufferGeometry().setFromPoints([a, b]));
  }, [max, extend]);

  const labelPositions: [number, number, number][] = [
    [max + extend + labelOffset, 0, 0],
    [0, max + extend + labelOffset, 0],
    [0, 0, max + extend + labelOffset],
  ];

  const tickPositions: ((i: number) => [number, number, number])[] = [
    (i) => [i, -0.6, 0],
    (i) => [-0.6, i, 0],
    (i) => [0, -0.6, i],
  ];

  return (
    <group>
      {AXES.map((ax, idx) => {
        const isActive = showSlice && sliceAxis === ax.axis;
        const lineColor = isActive ? ax.colorBright : ax.color;
        const lineOpacity = isActive ? 1 : 0.4;
        const labelColor = isActive ? ax.colorBright : ax.color;
        const labelFontSize = isActive ? '18px' : '14px';
        const tickColor = isActive ? ax.color : `${ax.color}88`;
        const tickFontSize = isActive ? '11px' : '9px';

        return (
          <group key={ax.axis}>
            {/* 軸線 */}
            <lineSegments geometry={geos[idx]}>
              <lineBasicMaterial color={lineColor} transparent opacity={lineOpacity} />
            </lineSegments>

            {/* Active 軸的 glow 線 */}
            {isActive && (
              <lineSegments geometry={geos[idx]}>
                <lineBasicMaterial color={ax.colorBright} transparent opacity={0.25} />
              </lineSegments>
            )}

            {/* 軸標籤 */}
            <Html position={labelPositions[idx]} center style={{ pointerEvents: 'none' }}>
              <div
                style={{
                  pointerEvents: 'none',
                  userSelect: 'none',
                  fontSize: labelFontSize,
                  fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif",
                  letterSpacing: '1px',
                  color: labelColor,
                  textShadow: isActive ? `0 0 12px ${ax.colorBright}` : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {ax.axis.toUpperCase()}
              </div>
            </Html>

            {/* 刻度數字 */}
            {Array.from({ length: size }).map((_, i) => {
              const isCurrent = isActive && i === sliceIndex;
              return (
                <Html key={`${ax.axis}-${i}`} position={tickPositions[idx](i)} center style={{ pointerEvents: 'none' }}>
                  <div
                    style={{
                      color: isCurrent ? ax.colorBright : tickColor,
                      fontSize: isCurrent ? '14px' : tickFontSize,
                      fontWeight: isCurrent ? 800 : isActive ? 600 : 400,
                      fontFamily: "'JetBrains Mono', monospace",
                      textShadow: isCurrent ? `0 0 10px ${ax.colorBright}` : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {i}
                  </div>
                </Html>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
