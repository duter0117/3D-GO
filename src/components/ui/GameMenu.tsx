'use client';
// ==============================
// 3D Go Game — Game Menu
// ==============================

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import styles from './GameMenu.module.css';

export function GameMenu() {
  const undo = useGameStore((s) => s.undo);
  const pass = useGameStore((s) => s.pass);
  const resign = useGameStore((s) => s.resign);
  const resetGame = useGameStore((s) => s.resetGame);
  const gameOver = useGameStore((s) => s.gameOver);
  const moveStack = useGameStore((s) => s.moveStack);
  const boardSize = useGameStore((s) => s.boardSize);

  const [showMenu, setShowMenu] = useState(false);
  const [showSizeSelect, setShowSizeSelect] = useState(false);

  const sizes = [5, 7, 9];

  return (
    <div className={styles.container}>
      {/* 菜單按鈕 */}
      <button
        className={styles.menuBtn}
        onClick={() => setShowMenu(!showMenu)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {showMenu && (
        <div className={styles.dropdown}>
          <button
            className={styles.menuItem}
            onClick={() => {
              setShowSizeSelect(!showSizeSelect);
            }}
          >
            🎮 新遊戲 ({boardSize}×{boardSize}×{boardSize})
          </button>

          {showSizeSelect && (
            <div className={styles.sizeSelect}>
              {sizes.map((s) => (
                <button
                  key={s}
                  className={`${styles.sizeBtn} ${boardSize === s ? styles.sizeActive : ''}`}
                  onClick={() => {
                    resetGame(s);
                    setShowSizeSelect(false);
                    setShowMenu(false);
                  }}
                >
                  {s}³
                </button>
              ))}
            </div>
          )}

          <button
            className={styles.menuItem}
            onClick={() => {
              undo();
              setShowMenu(false);
            }}
            disabled={moveStack.length === 0}
          >
            ↩ 悔棋
          </button>

          <button
            className={styles.menuItem}
            onClick={() => {
              pass();
              setShowMenu(false);
            }}
            disabled={gameOver}
          >
            ⏭ Pass
          </button>

          <button
            className={`${styles.menuItem} ${styles.dangerItem}`}
            onClick={() => {
              resign();
              setShowMenu(false);
            }}
            disabled={gameOver}
          >
            🏳 認輸
          </button>
        </div>
      )}
    </div>
  );
}
