'use client';
// ==============================
// 3D Go Game — Slice Controls
// ==============================

import { useGameStore } from '../../store/gameStore';
import { SliceAxis } from '../../engine/types';
import styles from './SliceControls.module.css';

export function SliceControls() {
  const boardSize = useGameStore((s) => s.boardSize);
  const showSlice = useGameStore((s) => s.showSlice);
  const sliceAxis = useGameStore((s) => s.sliceAxis);
  const sliceIndex = useGameStore((s) => s.sliceIndex);
  const setSlice = useGameStore((s) => s.setSlice);
  const toggleSliceMode = useGameStore((s) => s.toggleSliceMode);

  const axes: { key: SliceAxis; label: string }[] = [
    { key: 'x', label: 'X' },
    { key: 'y', label: 'Y' },
    { key: 'z', label: 'Z' },
  ];

  return (
    <div className={styles.container}>
      {/* 切片模式開關 */}
      <button
        className={`${styles.toggleBtn} ${showSlice ? styles.active : ''}`}
        onClick={toggleSliceMode}
        title="切片視角 (切換以查看內部棋子)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 3H3v18h18V3z" />
          <path d="M12 3v18" />
          <path d="M3 12h18" />
        </svg>
        <span>切片</span>
      </button>

      {showSlice && (
        <>
          {/* 軸選擇 */}
          <div className={styles.axisGroup}>
            {axes.map((a) => (
              <button
                key={a.key}
                className={`${styles.axisBtn} ${sliceAxis === a.key ? styles.axisActive : ''}`}
                onClick={() => setSlice(a.key, sliceIndex)}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* 層數滑桿 */}
          <div className={styles.sliderGroup}>
            <span className={styles.sliderLabel}>Layer {sliceIndex + 1}</span>
            <input
              type="range"
              min={0}
              max={boardSize - 1}
              value={sliceIndex}
              onChange={(e) => setSlice(sliceAxis, parseInt(e.target.value))}
              className={styles.slider}
            />
          </div>
        </>
      )}
    </div>
  );
}
