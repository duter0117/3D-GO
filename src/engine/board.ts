// ==============================
// 3D Go Game — Board Logic
// ==============================

import { Board, CellState, Position, StoneColor, Group, Capture, BoardHash } from './types';

/** 6 個方向的偏移量 */
const DIRECTIONS: Position[] = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];

/** 建立空棋盤 */
export function createBoard(size: number): Board {
  const board: Board = [];
  for (let x = 0; x < size; x++) {
    board[x] = [];
    for (let y = 0; y < size; y++) {
      board[x][y] = [];
      for (let z = 0; z < size; z++) {
        board[x][y][z] = null;
      }
    }
  }
  return board;
}

/** 深拷貝棋盤 */
export function cloneBoard(board: Board): Board {
  const size = board.length;
  const newBoard: Board = [];
  for (let x = 0; x < size; x++) {
    newBoard[x] = [];
    for (let y = 0; y < size; y++) {
      newBoard[x][y] = [...board[x][y]];
    }
  }
  return newBoard;
}

/** 檢查座標是否在棋盤範圍內 */
export function isInBounds(pos: Position, size: number): boolean {
  return (
    pos.x >= 0 && pos.x < size &&
    pos.y >= 0 && pos.y < size &&
    pos.z >= 0 && pos.z < size
  );
}

/** 取得格點狀態 */
export function getCell(board: Board, pos: Position): CellState {
  return board[pos.x][pos.y][pos.z];
}

/** 設定格點狀態 */
export function setCell(board: Board, pos: Position, state: CellState): void {
  board[pos.x][pos.y][pos.z] = state;
}

/** 取得相鄰的 6 個方向格點 */
export function getNeighbors(pos: Position, size: number): Position[] {
  return DIRECTIONS
    .map((d) => ({ x: pos.x + d.x, y: pos.y + d.y, z: pos.z + d.z }))
    .filter((p) => isInBounds(p, size));
}

/** 位置轉字串 key */
export function posKey(pos: Position): string {
  return `${pos.x},${pos.y},${pos.z}`;
}

/** BFS 找出一個連通分量（同色棋子群） */
export function getGroup(board: Board, startPos: Position): Group | null {
  const size = board.length;
  const color = getCell(board, startPos);
  if (!color) return null;

  const visited = new Set<string>();
  const positions: Position[] = [];
  const libertySet = new Set<string>();
  const queue: Position[] = [startPos];

  visited.add(posKey(startPos));

  while (queue.length > 0) {
    const pos = queue.shift()!;
    positions.push(pos);

    for (const neighbor of getNeighbors(pos, size)) {
      const nKey = posKey(neighbor);
      if (visited.has(nKey)) continue;

      const nCell = getCell(board, neighbor);
      if (nCell === null) {
        libertySet.add(nKey);
      } else if (nCell === color) {
        visited.add(nKey);
        queue.push(neighbor);
      }
    }
  }

  return { color, positions, liberties: libertySet.size };
}

/** 計算棋盤雜湊值（用於 SuperKo） */
export function hashBoard(board: Board): BoardHash {
  const size = board.length;
  const parts: string[] = [];
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const cell = board[x][y][z];
        parts.push(cell === 'black' ? 'B' : cell === 'white' ? 'W' : '.');
      }
    }
  }
  return parts.join('');
}

/** 對方顏色 */
export function oppositeColor(color: StoneColor): StoneColor {
  return color === 'black' ? 'white' : 'black';
}

/**
 * 落子並結算提子
 * 返回：{ newBoard, captures } 或 null (非法落子)
 */
export function placeStones(
  board: Board,
  positions: Position[],
  color: StoneColor,
  boardHistory: Set<BoardHash>
): { newBoard: Board; captures: Capture[] } | null {
  const size = board.length;

  // 檢查位置是否為空
  for (const pos of positions) {
    if (!isInBounds(pos, size)) return null;
    if (getCell(board, pos) !== null) return null;
  }

  // 檢查是否有重複位置
  const posKeys = new Set(positions.map(posKey));
  if (posKeys.size !== positions.length) return null;

  // 在棋盤上放置棋子
  const newBoard = cloneBoard(board);
  for (const pos of positions) {
    setCell(newBoard, pos, color);
  }

  // 先檢查對方是否有被提的子
  const opponent = oppositeColor(color);
  const captures: Capture[] = [];
  const checkedGroups = new Set<string>();

  for (const pos of positions) {
    for (const neighbor of getNeighbors(pos, size)) {
      const nCell = getCell(newBoard, neighbor);
      if (nCell !== opponent) continue;

      const nKey = posKey(neighbor);
      if (checkedGroups.has(nKey)) continue;

      const group = getGroup(newBoard, neighbor);
      if (!group) continue;

      // 標記已檢查的群組中所有位置
      for (const gPos of group.positions) {
        checkedGroups.add(posKey(gPos));
      }

      if (group.liberties === 0) {
        // 提子
        captures.push({ positions: group.positions, color: opponent });
        for (const gPos of group.positions) {
          setCell(newBoard, gPos, null);
        }
      }
    }
  }

  // 檢查自殺：放下的子自己的群是否有氣
  for (const pos of positions) {
    if (getCell(newBoard, pos) === null) continue; // 已被移除的情況（不應該發生）
    const group = getGroup(newBoard, pos);
    if (group && group.liberties === 0) {
      // 自殺！除非有提子
      if (captures.length === 0) {
        return null; // 非法自殺
      }
    }
  }

  // SuperKo 檢查
  const newHash = hashBoard(newBoard);
  if (boardHistory.has(newHash)) {
    return null; // 違反 SuperKo
  }

  return { newBoard, captures };
}

/**
 * 檢查某個位置是否為合法落子點
 */
export function isValidMove(
  board: Board,
  pos: Position,
  color: StoneColor,
  existingPendingMoves: Position[],
  boardHistory: Set<BoardHash>
): boolean {
  const allPositions = [...existingPendingMoves, pos];
  const result = placeStones(board, allPositions, color, boardHistory);
  return result !== null;
}

/**
 * 取得指定位置的棋子所屬群組的氣數
 */
export function getLibertiesAt(board: Board, pos: Position): number {
  const group = getGroup(board, pos);
  return group ? group.liberties : 0;
}

/**
 * 簡化版領地計算：空點若只被一色包圍則歸屬該色
 */
export function calculateTerritory(board: Board): { black: number; white: number } {
  const size = board.length;
  const visited = new Set<string>();
  let blackTerritory = 0;
  let whiteTerritory = 0;

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const pos: Position = { x, y, z };
        const key = posKey(pos);
        if (visited.has(key)) continue;
        if (getCell(board, pos) !== null) continue;

        // BFS 找出空點區域
        const region: Position[] = [];
        const queue: Position[] = [pos];
        const regionVisited = new Set<string>();
        regionVisited.add(key);
        let touchesBlack = false;
        let touchesWhite = false;

        while (queue.length > 0) {
          const current = queue.shift()!;
          region.push(current);
          visited.add(posKey(current));

          for (const neighbor of getNeighbors(current, size)) {
            const nKey = posKey(neighbor);
            const nCell = getCell(board, neighbor);

            if (nCell === 'black') {
              touchesBlack = true;
            } else if (nCell === 'white') {
              touchesWhite = true;
            } else if (!regionVisited.has(nKey)) {
              regionVisited.add(nKey);
              queue.push(neighbor);
            }
          }
        }

        if (touchesBlack && !touchesWhite) {
          blackTerritory += region.length;
        } else if (touchesWhite && !touchesBlack) {
          whiteTerritory += region.length;
        }
      }
    }
  }

  return { black: blackTerritory, white: whiteTerritory };
}
