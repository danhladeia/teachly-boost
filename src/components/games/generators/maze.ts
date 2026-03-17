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
    small:  { facil: 9,  medio: 13, dificil: 19 },
    medium: { facil: 13, medio: 21, dificil: 31 },
    large:  { facil: 19, medio: 31, dificil: 41 },
  };

  const mSize = config.mazeSize || "medium";
  const rawSize = complexityMap[mSize]?.[config.difficulty] ?? 19;
  const s = rawSize % 2 === 0 ? rawSize + 1 : rawSize;

  const grid = buildMaze(s, config.difficulty);

  return {
    grid,
    size: s,
    tema: config.tema,
    difficulty: config.difficulty,
    questions: [],
    checkpoints: [],
    style: config.mazeStyle || "square",
    mazeSize: mSize,
  };
}

// Fisher-Yates shuffle — works on any array
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Cardinal directions as [dr, dc] steps of 2 (maze cell spacing)
const DIRS: [number, number][] = [[0, 2], [2, 0], [0, -2], [-2, 0]];

/**
 * Iterative randomized DFS maze carver with per-difficulty directional bias.
 *
 * facil   → 70% chance to continue straight → long corridors, few branches
 * medio   → no bias → balanced branching (classic backtracker)
 * dificil → 70% chance to avoid going straight → windy, many dead-ends
 *
 * Post-processing:
 *   facil   → remove ~40% of dead-ends (open shortcuts)
 *   medio   → add mild loops (1.2% of cells)
 *   dificil → add more loops (2% of cells) creating deceptive false paths
 */
function buildMaze(s: number, difficulty: Difficulty): number[][] {
  const maze: number[][] = Array.from({ length: s }, () => Array(s).fill(1));

  maze[1][1] = 0;
  // Stack: [row, col, lastDirectionIndex (-1 = start)]
  const stack: [number, number, number][] = [[1, 1, -1]];

  while (stack.length > 0) {
    const [r, c, lastDir] = stack[stack.length - 1];
    const candidates = shuffle([0, 1, 2, 3]);

    if (lastDir >= 0) {
      if (difficulty === "facil" && Math.random() < 0.70) {
        // Bias: straight direction first → long open corridors
        const idx = candidates.indexOf(lastDir);
        if (idx > 0) { candidates.splice(idx, 1); candidates.unshift(lastDir); }
      } else if (difficulty === "dificil" && Math.random() < 0.70) {
        // Bias: straight direction last → forces turns, more dead-ends
        const idx = candidates.indexOf(lastDir);
        if (idx >= 0) { candidates.splice(idx, 1); candidates.push(lastDir); }
      }
      // "medio": pure random — no bias applied
    }

    let moved = false;
    for (const di of candidates) {
      const [dr, dc] = DIRS[di];
      const nr = r + dr, nc = c + dc;
      // Only visit interior odd-indexed cells that are still walls
      if (nr > 0 && nr < s - 1 && nc > 0 && nc < s - 1 && maze[nr][nc] === 1) {
        maze[r + dr / 2][c + dc / 2] = 0; // open wall between cells
        maze[nr][nc] = 0;                   // open destination cell
        stack.push([nr, nc, di]);
        moved = true;
        break;
      }
    }

    if (!moved) stack.pop(); // backtrack
  }

  // Entrance: top border gap at column 1 (top-left area)
  maze[0][1] = 0;
  // Exit: bottom border gap at column s-2 (bottom-right area)
  maze[s - 1][s - 2] = 0;

  // --- Post-processing per difficulty ---
  if (difficulty === "facil") {
    // Fewer dead-ends → cleaner, easier to navigate
    const dead = findDeadEnds(maze, s);
    removeDeadEnds(maze, s, dead, Math.floor(dead.length * 0.40));
  } else if (difficulty === "medio") {
    // A handful of extra junctions → moderate challenge
    addLoops(maze, s, Math.floor(s * s * 0.012));
  } else {
    // Many extra junctions → network of false paths that look like real solutions
    addLoops(maze, s, Math.floor(s * s * 0.020));
  }

  return maze;
}

/** Returns all open cells that have exactly 1 open neighbor (dead-ends). */
function findDeadEnds(maze: number[][], s: number): [number, number][] {
  const dead: [number, number][] = [];
  for (let r = 1; r < s - 1; r++) {
    for (let c = 1; c < s - 1; c++) {
      if (maze[r][c] === 0) {
        const openCount = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(
          ([nr, nc]) => nr >= 0 && nr < s && nc >= 0 && nc < s && maze[nr][nc] === 0
        ).length;
        if (openCount === 1) dead.push([r, c]);
      }
    }
  }
  return dead;
}

/**
 * For each dead-end, try to open a wall to a non-adjacent open cell (2 steps away),
 * creating a shortcut without breaking the maze structure.
 */
function removeDeadEnds(
  maze: number[][],
  s: number,
  deadEnds: [number, number][],
  count: number,
) {
  let removed = 0;
  for (const [r, c] of shuffle(deadEnds)) {
    if (removed >= count) break;
    for (const [dr, dc] of shuffle(DIRS)) {
      const nr = r + dr, nc = c + dc;
      const mr = r + dr / 2, mc = c + dc / 2;
      if (
        nr > 0 && nr < s - 1 && nc > 0 && nc < s - 1 &&
        maze[nr][nc] === 0 &&   // target cell is open (exists)
        maze[mr][mc] === 1      // wall between them is closed
      ) {
        maze[mr][mc] = 0; // open the connecting wall
        removed++;
        break;
      }
    }
  }
}

/**
 * Open random wall cells that connect at least 2 already-open cells,
 * creating loops (multiple paths to the same destination) without orphaning any cell.
 */
function addLoops(maze: number[][], s: number, count: number) {
  let added = 0;
  let attempts = 0;
  while (added < count && attempts < count * 20) {
    attempts++;
    const r = 1 + Math.floor(Math.random() * (s - 2));
    const c = 1 + Math.floor(Math.random() * (s - 2));
    if (maze[r][c] === 1) {
      const openNeighbors = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(
        ([nr, nc]) => nr >= 0 && nr < s && nc >= 0 && nc < s && maze[nr][nc] === 0
      ).length;
      if (openNeighbors >= 2) {
        maze[r][c] = 0;
        added++;
      }
    }
  }
}
