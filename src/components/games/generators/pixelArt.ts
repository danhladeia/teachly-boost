import type { GameConfig, Difficulty } from "../types";

export interface PixelArtData {
  gridSize: number;
  filledCells: [number, number][];
  tema: string;
}

export function generatePixelArt(config: GameConfig): PixelArtData {
  const sizeMap: Record<Difficulty, number> = { facil: 8, medio: 12, dificil: 16 };
  const gridSize = sizeMap[config.difficulty];
  const fillCount = Math.floor(gridSize * gridSize * 0.3);
  const cells = new Set<string>();
  
  // Generate a simple symmetric pattern
  while (cells.size < fillCount) {
    const r = Math.floor(Math.random() * gridSize);
    const c = Math.floor(Math.random() * Math.ceil(gridSize / 2));
    cells.add(`${r},${c}`);
    cells.add(`${r},${gridSize - 1 - c}`); // Mirror
  }

  const filledCells: [number, number][] = Array.from(cells).map(s => {
    const [r, c] = s.split(",").map(Number);
    return [r, c];
  });

  return { gridSize, filledCells, tema: config.tema };
}
