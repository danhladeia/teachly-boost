import type { GameConfig, Difficulty } from "../types";

export interface MazeQuestion {
  question: string;
  alternatives: string[];
  correctIndex: number;
}

export interface MazeData {
  grid: number[][];
  size: number;
  tema: string;
  difficulty: Difficulty;
  questions: MazeQuestion[];
  checkpoints: { row: number; col: number; questionIndex: number }[];
  style: string;
  mazeSize: string;
}

export function generateMaze(config: GameConfig): MazeData {
  const complexityMap: Record<string, Record<Difficulty, number>> = {
    small: { facil: 9, medio: 11, dificil: 13 },
    medium: { facil: 13, medio: 17, dificil: 21 },
    large: { facil: 19, medio: 25, dificil: 31 },
  };
  const mSize = config.mazeSize || "medium";
  const size = complexityMap[mSize]?.[config.difficulty] || 19;

  // Ensure odd size
  const s = size % 2 === 0 ? size + 1 : size;
  const maze: number[][] = Array.from({ length: s }, () => Array(s).fill(1));

  // Recursive backtracker
  function carve(r: number, c: number) {
    maze[r][c] = 0;
    const dirs = [[0, 2], [2, 0], [0, -2], [-2, 0]].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < s && nc >= 0 && nc < s && maze[nr][nc] === 1) {
        maze[r + dr / 2][c + dc / 2] = 0;
        carve(nr, nc);
      }
    }
  }

  carve(1, 1);
  maze[0][1] = 0;
  maze[s - 1][s - 2] = 0;

  const questions = config.mazeQuestions || [];
  const checkpoints: { row: number; col: number; questionIndex: number }[] = [];

  if (questions.length > 0) {
    const pathCells: { row: number; col: number }[] = [];
    for (let r = 1; r < s - 1; r++)
      for (let c = 1; c < s - 1; c++)
        if (maze[r][c] === 0) pathCells.push({ row: r, col: c });

    const step = Math.floor(pathCells.length / (questions.length + 1));
    for (let i = 0; i < Math.min(questions.length, 5); i++) {
      const idx = step * (i + 1);
      if (idx < pathCells.length) {
        const cell = pathCells[idx];
        maze[cell.row][cell.col] = 2;
        checkpoints.push({ row: cell.row, col: cell.col, questionIndex: i });
      }
    }
  }

  return {
    grid: maze,
    size: s,
    tema: config.tema,
    difficulty: config.difficulty,
    questions,
    checkpoints,
    style: config.mazeStyle || "square",
    mazeSize: mSize,
  };
}
