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
  // Much harder difficulty settings — "dificil" is truly complex
  const complexityMap: Record<string, Record<Difficulty, number>> = {
    small:  { facil: 9,  medio: 13, dificil: 19 },
    medium: { facil: 13, medio: 21, dificil: 31 },
    large:  { facil: 19, medio: 31, dificil: 41 },
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
  maze[0][1] = 0;       // entrance
  maze[s - 1][s - 2] = 0; // exit

  // For hard difficulty, add extra openings to create loops and dead-ends
  if (config.difficulty === "dificil") {
    const extraPaths = Math.floor(s * s * 0.04);
    for (let i = 0; i < extraPaths; i++) {
      const r = 1 + Math.floor(Math.random() * (s - 2));
      const c = 1 + Math.floor(Math.random() * (s - 2));
      if (maze[r][c] === 1) {
        // Only open if it connects two open cells
        const neighbors = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(
          ([nr,nc]) => nr >= 0 && nr < s && nc >= 0 && nc < s && maze[nr][nc] === 0
        );
        if (neighbors.length >= 2) {
          maze[r][c] = 0;
        }
      }
    }
  } else if (config.difficulty === "medio") {
    const extraPaths = Math.floor(s * s * 0.02);
    for (let i = 0; i < extraPaths; i++) {
      const r = 1 + Math.floor(Math.random() * (s - 2));
      const c = 1 + Math.floor(Math.random() * (s - 2));
      if (maze[r][c] === 1) {
        const neighbors = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(
          ([nr,nc]) => nr >= 0 && nr < s && nc >= 0 && nc < s && maze[nr][nc] === 0
        );
        if (neighbors.length >= 2) {
          maze[r][c] = 0;
        }
      }
    }
  }

  // Questions are optional — only place checkpoints if questions exist
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
