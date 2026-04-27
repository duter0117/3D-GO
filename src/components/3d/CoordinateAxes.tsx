'use client';
// ==============================
// 3D Go Game — Coordinate Axes
// ==============================

import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface AxesProps {
  size: number;
}

export function CoordinateAxes({ size }: AxesProps) {
  const max = size - 1;
  const extend = 1.2;
  const labelOffset = 0.6;

  const axisGeometry = useMemo(() => {
    const xPts = [
      new THREE.Vector3(-extend, 0, 0),
      new THREE.Vector3(max + extend, 0, 0),
    ];
    const yPts = [
      new THREE.Vector3(0, -extend, 0),
      new THREE.Vector3(0, max + extend, 0),
    ];
    const zPts = [
      new THREE.Vector3(0, 0, -extend),
      new THREE.Vector3(0, 0, max + extend),
    ];

    // 把 3 條軸合成一個 lineSegments 幾何
    const allPts = [...xPts, ...yPts, ...zPts];
    const geo = new THREE.BufferGeometry().setFromPoints(allPts);

    // 每條線 2 個頂點，3 條線共 6 頂點，設定 per-vertex color
    const colors = new Float32Array([
      // X — 紅
      0.8, 0.2, 0.2, 0.8, 0.2, 0.2,
      // Y — 綠
      0.13, 0.67, 0.27, 0.13, 0.67, 0.27,
      // Z — 藍
      0.2, 0.4, 0.8, 0.2, 0.4, 0.8,
    ]);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geo;
  }, [max, extend]);

  const labelStyle: React.CSSProperties = {
    pointerEvents: 'none',
    userSelect: 'none',
    fontSize: '14px',
    fontWeight: 700,
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '1px',
  };

  return (
    <group>
      {/* 軸線 */}
      <lineSegments geometry={axisGeometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.6} />
      </lineSegments>

      {/* 軸標籤 */}
      <Html position={[max + extend + labelOffset, 0, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ ...labelStyle, color: '#cc3333' }}>X</div>
      </Html>
      <Html position={[0, max + extend + labelOffset, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ ...labelStyle, color: '#22aa44' }}>Y</div>
      </Html>
      <Html position={[0, 0, max + extend + labelOffset]} center style={{ pointerEvents: 'none' }}>
        <div style={{ ...labelStyle, color: '#3366cc' }}>Z</div>
      </Html>

      {/* 刻度數字 */}
      {Array.from({ length: size }).map((_, i) => (
        <group key={`ticks-${i}`}>
          <Html position={[i, -0.6, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{ color: '#cc333388', fontSize: '9px', fontFamily: "'JetBrains Mono', monospace" }}>
              {i}
            </div>
          </Html>
          <Html position={[-0.6, i, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{ color: '#22aa4488', fontSize: '9px', fontFamily: "'JetBrains Mono', monospace" }}>
              {i}
            </div>
          </Html>
          <Html position={[0, -0.6, i]} center style={{ pointerEvents: 'none' }}>
            <div style={{ color: '#3366cc88', fontSize: '9px', fontFamily: "'JetBrains Mono', monospace" }}>
              {i}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}
