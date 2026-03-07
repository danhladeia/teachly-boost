import type { GameConfig, Difficulty } from "../types";

export interface SudokuData {
  grids: { puzzle: (number | null)[][]; size: number }[];
  difficulty: Difficulty;
}

function generateSudokuGrid(size: number, removals: number): (number | null)[][] {
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  const boxH = size === 4 ? 2 : size === 6 ? 2 : 3;
  const boxW = size === 4 ? 2 : size === 6 ? 3 : 3;

  function isValid(r: number, c: number, num: number): boolean {
    for (let i = 0; i < size; i++) {
      if (grid[r][i] === num || grid[i][c] === num) return false;
    }
    const br = Math.floor(r / boxH) * boxH, bc = Math.floor(c / boxW) * boxW;
    for (let i = br; i < br + boxH; i++)
      for (let j = bc; j < bc + boxW; j++)
        if (grid[i][j] === num) return false;
    return true;
  }

  function fill(pos: number): boolean {
    if (pos === size * size) return true;
    const r = Math.floor(pos / size), c = pos % size;
    const nums = Array.from({ length: size }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    for (const n of nums) {
      if (isValid(r, c, n)) {
        grid[r][c] = n;
        if (fill(pos + 1)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }

  fill(0);

  const result: (number | null)[][] = grid.map(row => [...row]);
  let removed = 0;
  const positions = Array.from({ length: size * size }, (_, i) => i).sort(() => Math.random() - 0.5);
  for (const pos of positions) {
    if (removed >= removals) break;
    result[Math.floor(pos / size)][pos % size] = null;
    removed++;
  }

  return result;
}

export function generateSudoku(config: GameConfig): SudokuData {
  const sizeMap: Record<Difficulty, number> = { facil: 4, medio: 6, dificil: 9 };
  const removalsMap: Record<Difficulty, number> = { facil: 6, medio: 14, dificil: 40 };
  const countMap: Record<Difficulty, number> = { facil: 4, medio: 4, dificil: 2 };
  const size = sizeMap[config.difficulty];
  const removals = removalsMap[config.difficulty];
  const count = countMap[config.difficulty];

  const grids = Array.from({ length: count }, () => ({
    puzzle: generateSudokuGrid(size, removals),
    size,
  }));

  return { grids, difficulty: config.difficulty };
}
