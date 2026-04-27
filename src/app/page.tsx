'use client';

import dynamic from 'next/dynamic';
import { GameHUD } from '../components/ui/GameHUD';
import { SliceControls } from '../components/ui/SliceControls';
import { GameMenu } from '../components/ui/GameMenu';

// 動態載入 Canvas（SSR 不支援 WebGL）
const GameCanvas = dynamic(
  () => import('../components/3d/GameCanvas').then((m) => ({ default: m.GameCanvas })),
  { ssr: false }
);

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', background: '#e8ecf4' }}>
      {/* 標題 */}
      <div className="game-title">
        3D GO<span>空間圍棋</span>
      </div>

      {/* 3D 場景 */}
      <GameCanvas />

      {/* 2D UI Overlay */}
      <GameHUD />
      <GameMenu />
      <SliceControls />

      {/* 操作提示 */}
      <div className="controls-hint">
        滑鼠左鍵旋轉 · 右鍵平移 · 滾輪縮放 · 點擊格點落子
      </div>
    </main>
  );
}
