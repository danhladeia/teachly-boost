import type { GameConfig, Difficulty } from "../types";

export interface MazeData {
  grid: boolean[][];
  size: number;
  tema: string;
  difficulty: Difficulty;
}

export function generateMaze(config: GameConfig): MazeData {
  const sizes: Record<Difficulty, number> = { facil: 11, medio: 17, dificil: 25 };
  const size = sizes[config.difficulty];
  const maze: boolean[][] = Array.from({ length: size }, () => Array(size).fill(true));
  const visited: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function carve(r: number, c: number) {
    visited[r][c] = true;
    maze[r][c] = false;
    const dirs = [[0, 2], [2, 0], [0, -2], [-2, 0]].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
        maze[r + dr / 2][c + dc / 2] = false;
        carve(nr, nc);
      }
    }
  }

  carve(1, 1);
  maze[0][1] = false;
  maze[size - 1][size - 2] = false;

  return { grid: maze, size, tema: config.tema, difficulty: config.difficulty };
}
