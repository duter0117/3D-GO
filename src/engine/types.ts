// ==============================
// 3D Go Game — Core Types
// ==============================

/** 3D座標 */
export interface Position {
  x: number;
  y: number;
  z: number;
}

/** 棋子顏色 */
export type StoneColor = 'black' | 'white';

/** 格點狀態 */
export type CellState = StoneColor | null;

/** 棋盤：3D陣列 board[x][y][z] */
export type Board = CellState[][][];

/** 連通的棋子群 */
export interface Group {
  color: StoneColor;
  positions: Position[];
  liberties: number;
}

/** 落子動作（一回合最多兩子） */
export interface Move {
  stones: Position[];
  color: StoneColor;
}

/** 被提走的子 */
export interface Capture {
  positions: Position[];
  color: StoneColor;
}

/** 遊戲狀態快照（用於 SuperKo 檢測） */
export type BoardHash = string;

/** 落子階段 */
export type TurnPhase = 'first' | 'second' | 'confirm';

/** 切片軸 */
export type SliceAxis = 'x' | 'y' | 'z';

/** 遊戲結果 */
export interface GameResult {
  winner: StoneColor | 'draw';
  blackCaptures: number;
  whiteCaptures: number;
  blackTerritory: number;
  whiteTerritory: number;
}
