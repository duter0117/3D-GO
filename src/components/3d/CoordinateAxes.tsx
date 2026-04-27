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
  const extend = 1.2; // 軸線延伸量
  const labelOffset = 0.6;

  const { xGeo, yGeo, zGeo } = useMemo(() => {
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
    return {
      xGeo: new THREE.BufferGeometry().setFromPoints(xPts),
      yGeo: new THREE.BufferGeometry().setFromPoints(yPts),
      zGeo: new THREE.BufferGeometry().setFromPoints(zPts),
    };
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
      {/* X 軸 — 紅色 */}
      <line geometry={xGeo}>
        <lineBasicMaterial color="#cc3333" opacity={0.6} transparent linewidth={1} />
      </line>
      <Html position={[max + extend + labelOffset, 0, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ ...labelStyle, color: '#cc3333' }}>X</div>
      </Html>

      {/* Y 軸 — 綠色 */}
      <line geometry={yGeo}>
        <lineBasicMaterial color="#22aa44" opacity={0.6} transparent linewidth={1} />
      </line>
      <Html position={[0, max + extend + labelOffset, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ ...labelStyle, color: '#22aa44' }}>Y</div>
      </Html>

      {/* Z 軸 — 藍色 */}
      <line geometry={zGeo}>
        <lineBasicMaterial color="#3366cc" opacity={0.6} transparent linewidth={1} />
      </line>
      <Html position={[0, 0, max + extend + labelOffset]} center style={{ pointerEvents: 'none' }}>
        <div style={{ ...labelStyle, color: '#3366cc' }}>Z</div>
      </Html>

      {/* 原點刻度數字 */}
      {Array.from({ length: size }).map((_, i) => (
        <group key={`ticks-${i}`}>
          {/* X 軸刻度 */}
          <Html position={[i, -0.6, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{ color: '#cc333388', fontSize: '9px', fontFamily: "'JetBrains Mono', monospace" }}>
              {i}
            </div>
          </Html>
          {/* Y 軸刻度 */}
          <Html position={[-0.6, i, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{ color: '#22aa4488', fontSize: '9px', fontFamily: "'JetBrains Mono', monospace" }}>
              {i}
            </div>
          </Html>
          {/* Z 軸刻度 */}
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
