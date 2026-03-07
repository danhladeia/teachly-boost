import type { GameConfig } from "../types";

export interface TicTacToeGrid {
  cells: string[];
}

export interface TicTacToeData {
  grids: TicTacToeGrid[];
  tema: string;
}

export function generateTicTacToe(config: GameConfig): TicTacToeData {
  const words = config.palavras.split(",").map(w => w.trim()).filter(Boolean);
  const grids: TicTacToeGrid[] = [];
  for (let g = 0; g < 6; g++) {
    const cells: string[] = [];
    for (let i = 0; i < 9; i++) {
      cells.push(words[(g * 9 + i) % Math.max(words.length, 1)] || `Q${i + 1}`);
    }
    grids.push({ cells });
  }
  return { grids, tema: config.tema };
}
