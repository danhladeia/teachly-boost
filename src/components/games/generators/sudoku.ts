import type { GameConfig, Difficulty } from "../types";

export interface SudokuData {
  grids: { puzzle: (string | null)[][]; solution: string[][]; size: number }[];
  difficulty: Difficulty;
  contentType: string;
}

function generateSudokuGrid(size: number, removals: number, symbols: string[]): { puzzle: (string | null)[][]; solution: string[][] } {
  const numGrid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  const boxH = size === 4 ? 2 : size === 6 ? 2 : 3;
  const boxW = size === 4 ? 2 : size === 6 ? 3 : 3;

  function isValid(r: number, c: number, num: number): boolean {
    for (let i = 0; i < size; i++) {
      if (numGrid[r][i] === num || numGrid[i][c] === num) return false;
    }
    const br = Math.floor(r / boxH) * boxH, bc = Math.floor(c / boxW) * boxW;
    for (let i = br; i < br + boxH; i++)
      for (let j = bc; j < bc + boxW; j++)
        if (numGrid[i][j] === num) return false;
    return true;
  }

  function fill(pos: number): boolean {
    if (pos === size * size) return true;
    const r = Math.floor(pos / size), c = pos % size;
    const nums = Array.from({ length: size }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    for (const n of nums) {
      if (isValid(r, c, n)) {
        numGrid[r][c] = n;
        if (fill(pos + 1)) return true;
        numGrid[r][c] = 0;
      }
    }
    return false;
  }

  fill(0);

  const solution: string[][] = numGrid.map(row => row.map(n => symbols[n - 1]));
  const puzzle: (string | null)[][] = solution.map(row => [...row]);

  let removed = 0;
  const positions = Array.from({ length: size * size }, (_, i) => i).sort(() => Math.random() - 0.5);
  for (const pos of positions) {
    if (removed >= removals) break;
    puzzle[Math.floor(pos / size)][pos % size] = null;
    removed++;
  }

  return { puzzle, solution };
}

export function generateSudoku(config: GameConfig): SudokuData {
  const size = config.sudokuSize || (config.difficulty === "facil" ? 4 : config.difficulty === "medio" ? 6 : 9);
  const removalsMap: Record<number, Record<Difficulty, number>> = {
    4: { facil: 4, medio: 6, dificil: 8 },
    6: { facil: 10, medio: 14, dificil: 18 },
    9: { facil: 30, medio: 40, dificil: 55 },
  };
  const removals = removalsMap[size]?.[config.difficulty] || 30;
  const count = size <= 6 ? 4 : 2;

  let symbols: string[];
  const contentType = config.sudokuContentType || "numbers";

  if (contentType === "shapes") {
    const shapes = ["●", "■", "▲", "◆", "★", "♥", "⬟", "⬡", "◉"];
    symbols = shapes.slice(0, size);
  } else if (contentType === "words" && config.sudokuCustomSymbols?.length === size) {
    symbols = config.sudokuCustomSymbols;
  } else {
    symbols = Array.from({ length: size }, (_, i) => String(i + 1));
  }

  const grids = Array.from({ length: count }, () => {
    const { puzzle, solution } = generateSudokuGrid(size, removals, symbols);
    return { puzzle, solution, size };
  });

  return { grids, difficulty: config.difficulty, contentType };
}
