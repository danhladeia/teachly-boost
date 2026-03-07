import type { GameConfig, Difficulty } from "../types";

export interface MazeQuestion {
  question: string;
  alternatives: string[];
  correctIndex: number;
}

export interface MazeData {
  grid: number[][]; // 0=path, 1=wall, 2=checkpoint
  size: number;
  tema: string;
  difficulty: Difficulty;
  questions: MazeQuestion[];
  checkpoints: { row: number; col: number; questionIndex: number }[];
  style: string;
}

export function generateMaze(config: GameConfig): MazeData {
  const sizes: Record<Difficulty, number> = { facil: 13, medio: 19, dificil: 27 };
  const size = sizes[config.difficulty];
  const maze: number[][] = Array.from({ length: size }, () => Array(size).fill(1));
  const visited: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Recursive backtracker
  function carve(r: number, c: number) {
    visited[r][c] = true;
    maze[r][c] = 0;
    const dirs = [[0, 2], [2, 0], [0, -2], [-2, 0]].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
        maze[r + dr / 2][c + dc / 2] = 0;
        carve(nr, nc);
      }
    }
  }

  carve(1, 1);
  // Entrance and exit
  maze[0][1] = 0;
  maze[size - 1][size - 2] = 0;

  // Place checkpoints along the solution path
  const questions = config.mazeQuestions || [];
  const checkpoints: { row: number; col: number; questionIndex: number }[] = [];

  if (questions.length > 0) {
    // Find path cells (not walls, not entrance/exit)
    const pathCells: { row: number; col: number }[] = [];
    for (let r = 1; r < size - 1; r++) {
      for (let c = 1; c < size - 1; c++) {
        if (maze[r][c] === 0) pathCells.push({ row: r, col: c });
      }
    }

    // Distribute checkpoints evenly along path
    const step = Math.floor(pathCells.length / (questions.length + 1));
    for (let i = 0; i < Math.min(questions.length, 5); i++) {
      const idx = step * (i + 1);
      if (idx < pathCells.length) {
        const cell = pathCells[idx];
        maze[cell.row][cell.col] = 2; // checkpoint marker
        checkpoints.push({ row: cell.row, col: cell.col, questionIndex: i });
      }
    }
  }

  return {
    grid: maze,
    size,
    tema: config.tema,
    difficulty: config.difficulty,
    questions,
    checkpoints,
    style: config.mazeStyle || "square",
  };
}
