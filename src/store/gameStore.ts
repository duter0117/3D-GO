// ==============================
// 3D Go Game — Zustand Store
// ==============================

import { create } from 'zustand';
import {
  Board,
  Position,
  StoneColor,
  TurnPhase,
  SliceAxis,
  BoardHash,
  Capture,
} from '../engine/types';
import {
  createBoard,
  cloneBoard,
  placeStones,
  hashBoard,
  oppositeColor,
  isValidMove,
  calculateTerritory,
} from '../engine/board';

interface HistoryEntry {
  board: Board;
  hash: BoardHash;
  currentPlayer: StoneColor;
  captures: { black: number; white: number };
  isFirstMove: boolean;
}

interface GameStore {
  // === 遊戲狀態 ===
  boardSize: number;
  board: Board;
  currentPlayer: StoneColor;
  turnPhase: TurnPhase;
  pendingMoves: Position[];
  captures: { black: number; white: number };
  isFirstMove: boolean;
  consecutivePasses: number;
  gameOver: boolean;
  winner: StoneColor | 'draw' | null;

  // === 歷史（用於悔棋與 SuperKo） ===
  boardHistory: Set<BoardHash>;
  moveStack: HistoryEntry[];

  // === 最近被提的子（用於動畫） ===
  lastCaptures: Capture[];

  // === 視覺控制 ===
  sliceAxis: SliceAxis;
  sliceIndex: number;
  showSlice: boolean;
  hoveredPosition: Position | null;

  // === Actions ===
  selectPosition: (pos: Position) => void;
  confirmTurn: () => void;
  undoSelection: () => void;
  undo: () => void;
  pass: () => void;
  resetGame: (size?: number) => void;
  setSlice: (axis: SliceAxis, index: number) => void;
  toggleSliceMode: () => void;
  setHoveredPosition: (pos: Position | null) => void;
  resign: () => void;
}

const DEFAULT_SIZE = 7;

function createInitialState(size: number) {
  const board = createBoard(size);
  const hash = hashBoard(board);
  return {
    boardSize: size,
    board,
    currentPlayer: 'black' as StoneColor,
    turnPhase: 'first' as TurnPhase,
    pendingMoves: [] as Position[],
    captures: { black: 0, white: 0 },
    isFirstMove: true,
    consecutivePasses: 0,
    gameOver: false,
    winner: null as StoneColor | 'draw' | null,
    boardHistory: new Set<BoardHash>([hash]),
    moveStack: [] as HistoryEntry[],
    lastCaptures: [] as Capture[],
    sliceAxis: 'y' as SliceAxis,
    sliceIndex: Math.floor(size / 2),
    showSlice: false,
    hoveredPosition: null as Position | null,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(DEFAULT_SIZE),

  selectPosition: (pos: Position) => {
    const state = get();
    if (state.gameOver) return;

    const maxMoves = state.isFirstMove ? 1 : 2;

    // 如果已經在確認階段，不能再選
    if (state.pendingMoves.length >= maxMoves) return;

    // 檢查是否已被佔用
    if (state.board[pos.x][pos.y][pos.z] !== null) return;

    // 檢查是否已在待定列表中
    if (state.pendingMoves.some((p) => p.x === pos.x && p.y === pos.y && p.z === pos.z)) return;

    // 檢查合法性
    const valid = isValidMove(
      state.board,
      pos,
      state.currentPlayer,
      state.pendingMoves,
      state.boardHistory
    );
    if (!valid) return;

    const newPending = [...state.pendingMoves, pos];
    const newPhase: TurnPhase =
      newPending.length >= maxMoves ? 'confirm' : 'second';

    set({ pendingMoves: newPending, turnPhase: newPhase });
  },

  confirmTurn: () => {
    const state = get();
    if (state.gameOver) return;
    if (state.pendingMoves.length === 0) return;

    const maxMoves = state.isFirstMove ? 1 : 2;
    if (state.pendingMoves.length < maxMoves) return;

    const result = placeStones(
      state.board,
      state.pendingMoves,
      state.currentPlayer,
      state.boardHistory
    );
    if (!result) return;

    const { newBoard, captures: capturedGroups } = result;
    const newHash = hashBoard(newBoard);

    // 保存歷史
    const historyEntry: HistoryEntry = {
      board: cloneBoard(state.board),
      hash: hashBoard(state.board),
      currentPlayer: state.currentPlayer,
      captures: { ...state.captures },
      isFirstMove: state.isFirstMove,
    };

    // 計算提子數
    const capturedCount = capturedGroups.reduce((sum, c) => sum + c.positions.length, 0);
    const newCaptures = { ...state.captures };
    // 提了對方的子，算到己方的計分
    newCaptures[state.currentPlayer] += capturedCount;

    const newHistory = new Set(state.boardHistory);
    newHistory.add(newHash);

    set({
      board: newBoard,
      currentPlayer: oppositeColor(state.currentPlayer),
      turnPhase: 'first',
      pendingMoves: [],
      captures: newCaptures,
      isFirstMove: false,
      consecutivePasses: 0,
      boardHistory: newHistory,
      moveStack: [...state.moveStack, historyEntry],
      lastCaptures: capturedGroups,
    });
  },

  undoSelection: () => {
    const state = get();
    if (state.pendingMoves.length === 0) return;

    const newPending = state.pendingMoves.slice(0, -1);
    const maxMoves = state.isFirstMove ? 1 : 2;
    const newPhase: TurnPhase =
      newPending.length === 0
        ? 'first'
        : newPending.length < maxMoves
        ? 'second'
        : 'confirm';

    set({ pendingMoves: newPending, turnPhase: newPhase });
  },

  undo: () => {
    const state = get();
    if (state.moveStack.length === 0) return;

    const prev = state.moveStack[state.moveStack.length - 1];
    const newStack = state.moveStack.slice(0, -1);

    // 重建 boardHistory
    const newHistory = new Set<BoardHash>();
    const emptyHash = hashBoard(createBoard(state.boardSize));
    newHistory.add(emptyHash);
    for (const entry of newStack) {
      newHistory.add(entry.hash);
    }
    newHistory.add(hashBoard(prev.board));

    set({
      board: prev.board,
      currentPlayer: prev.currentPlayer,
      captures: prev.captures,
      isFirstMove: prev.isFirstMove,
      turnPhase: 'first',
      pendingMoves: [],
      moveStack: newStack,
      boardHistory: newHistory,
      lastCaptures: [],
      gameOver: false,
      winner: null,
      consecutivePasses: 0,
    });
  },

  pass: () => {
    const state = get();
    if (state.gameOver) return;

    const newPasses = state.consecutivePasses + 1;

    // 雙方都 pass → 遊戲結束
    if (newPasses >= 2) {
      const territory = calculateTerritory(state.board);
      const blackScore = state.captures.black + territory.black;
      const whiteScore = state.captures.white + territory.white;

      let winner: StoneColor | 'draw';
      if (blackScore > whiteScore) winner = 'black';
      else if (whiteScore > blackScore) winner = 'white';
      else winner = 'draw';

      set({
        gameOver: true,
        winner,
        consecutivePasses: newPasses,
        pendingMoves: [],
        turnPhase: 'first',
      });
      return;
    }

    // 保存歷史
    const historyEntry: HistoryEntry = {
      board: cloneBoard(state.board),
      hash: hashBoard(state.board),
      currentPlayer: state.currentPlayer,
      captures: { ...state.captures },
      isFirstMove: state.isFirstMove,
    };

    set({
      currentPlayer: oppositeColor(state.currentPlayer),
      turnPhase: 'first',
      pendingMoves: [],
      consecutivePasses: newPasses,
      isFirstMove: false,
      moveStack: [...state.moveStack, historyEntry],
      lastCaptures: [],
    });
  },

  resetGame: (size?: number) => {
    set(createInitialState(size ?? get().boardSize));
  },

  setSlice: (axis: SliceAxis, index: number) => {
    set({ sliceAxis: axis, sliceIndex: index });
  },

  toggleSliceMode: () => {
    set((s) => ({ showSlice: !s.showSlice }));
  },

  setHoveredPosition: (pos: Position | null) => {
    set({ hoveredPosition: pos });
  },

  resign: () => {
    const state = get();
    if (state.gameOver) return;
    set({
      gameOver: true,
      winner: oppositeColor(state.currentPlayer),
    });
  },
}));
