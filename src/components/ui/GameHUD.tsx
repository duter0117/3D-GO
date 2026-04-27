'use client';
// ==============================
// 3D Go Game — HUD (Heads-Up Display)
// ==============================

import { useGameStore } from '../../store/gameStore';
import styles from './GameHUD.module.css';

export function GameHUD() {
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const turnPhase = useGameStore((s) => s.turnPhase);
  const pendingMoves = useGameStore((s) => s.pendingMoves);
  const captures = useGameStore((s) => s.captures);
  const isFirstMove = useGameStore((s) => s.isFirstMove);
  const gameOver = useGameStore((s) => s.gameOver);
  const winner = useGameStore((s) => s.winner);
  const confirmTurn = useGameStore((s) => s.confirmTurn);
  const undoSelection = useGameStore((s) => s.undoSelection);
  const moveStack = useGameStore((s) => s.moveStack);
  const hoveredPosition = useGameStore((s) => s.hoveredPosition);

  const maxMoves = isFirstMove ? 1 : 2;

  const getPhaseText = () => {
    if (gameOver) return '遊戲結束';
    if (turnPhase === 'confirm') return '確認落子';
    if (turnPhase === 'first') return `選擇第 1 子`;
    return `選擇第 2 子`;
  };

  const getPhaseSubtext = () => {
    if (gameOver) return '';
    if (isFirstMove) return '(首手只落 1 子)';
    return `(${pendingMoves.length}/${maxMoves})`;
  };

  return (
    <div className={styles.hud}>
      {/* 玩家指示器 */}
      <div className={styles.playerSection}>
        <div className={`${styles.playerIndicator} ${styles[currentPlayer]}`}>
          <div className={styles.stoneIcon} />
          <span>{currentPlayer === 'black' ? '黑方' : '白方'}</span>
        </div>
      </div>

      {/* 階段指示 */}
      <div className={styles.phaseSection}>
        <div className={styles.phaseText}>{getPhaseText()}</div>
        <div className={styles.phaseSubtext}>{getPhaseSubtext()}</div>
      </div>

      {/* Hover 座標顯示 */}
      {hoveredPosition && !gameOver && (
        <div className={styles.hoverCoord}>
          ▸ 目標: <span className={styles.coordX}>{hoveredPosition.x}</span>,{' '}
          <span className={styles.coordY}>{hoveredPosition.y}</span>,{' '}
          <span className={styles.coordZ}>{hoveredPosition.z}</span>
        </div>
      )}

      {/* 待定落子座標 */}
      {pendingMoves.length > 0 && (
        <div className={styles.pendingSection}>
          {pendingMoves.map((pos, i) => (
            <div key={i} className={styles.pendingMove}>
              ◆ ({pos.x}, {pos.y}, {pos.z})
            </div>
          ))}
        </div>
      )}

      {/* 操作按鈕 */}
      <div className={styles.buttonSection}>
        {turnPhase === 'confirm' && (
          <button
            className={`${styles.btn} ${styles.confirmBtn}`}
            onClick={confirmTurn}
          >
            ✓ 確認
          </button>
        )}
        {pendingMoves.length > 0 && (
          <button
            className={`${styles.btn} ${styles.undoBtn}`}
            onClick={undoSelection}
          >
            ✕ 撤回
          </button>
        )}
      </div>

      {/* 提子計數 */}
      <div className={styles.captureSection}>
        <div className={styles.captureRow}>
          <div className={`${styles.miniStone} ${styles.blackMini}`} />
          <span>黑方提子: {captures.black}</span>
        </div>
        <div className={styles.captureRow}>
          <div className={`${styles.miniStone} ${styles.whiteMini}`} />
          <span>白方提子: {captures.white}</span>
        </div>
      </div>

      {/* 手數 */}
      <div className={styles.moveCount}>
        第 {moveStack.length + 1} 手
      </div>

      {/* 遊戲結束 */}
      {gameOver && (
        <div className={styles.gameOverOverlay}>
          <div className={styles.gameOverText}>
            {winner === 'draw' ? '平局！' : `${winner === 'black' ? '黑方' : '白方'} 勝！`}
          </div>
        </div>
      )}
    </div>
  );
}
