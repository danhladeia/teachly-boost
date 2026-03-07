import type { GameConfig, Difficulty, GridSize } from "../types";

export interface WordSearchData {
  grid: string[][];
  placedWords: string[];
  tema: string;
  difficulty: Difficulty;
  hideWordList: boolean;
}

function getGridSize(gridSize?: GridSize, difficulty?: Difficulty): number {
  if (gridSize) {
    const map: Record<GridSize, number> = { "10x10": 10, "15x15": 15, "20x20": 20 };
    return map[gridSize];
  }
  const fallback: Record<Difficulty, number> = { facil: 10, medio: 15, dificil: 20 };
  return fallback[difficulty || "medio"];
}

function getDirections(difficulty: Difficulty): number[][] {
  switch (difficulty) {
    case "facil":
      return [[0, 1], [1, 0]]; // horizontal + vertical only
    case "medio":
      return [[0, 1], [1, 0], [1, 1], [-1, 1]]; // + diagonals
    case "dificil":
      return [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]; // + reversed
  }
}

export function generateWordSearch(config: GameConfig): WordSearchData {
  const gridSize = getGridSize(config.gridSize, config.difficulty);
  const directions = getDirections(config.difficulty);
  const wordList = config.palavras
    .split(",")
    .map(w => w.trim().toUpperCase().replace(/[^A-ZÁÉÍÓÚÂÊÔÃÕÇ]/g, ""))
    .filter(w => w.length > 1 && w.length <= gridSize);

  const grid: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(""));
  const placedWords: string[] = [];
  const sorted = [...wordList].sort((a, b) => b.length - a.length).slice(0, 20);

  for (const word of sorted) {
    let placed = false;
    for (let attempt = 0; attempt < 300 && !placed; attempt++) {
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const sr = Math.floor(Math.random() * gridSize);
      const sc = Math.floor(Math.random() * gridSize);
      let fits = true;
      for (let k = 0; k < word.length; k++) {
        const r = sr + dir[0] * k, c = sc + dir[1] * k;
        if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) { fits = false; break; }
        if (grid[r][c] !== "" && grid[r][c] !== word[k]) { fits = false; break; }
      }
      if (fits) {
        for (let k = 0; k < word.length; k++) grid[sr + dir[0] * k][sc + dir[1] * k] = word[k];
        placedWords.push(word);
        placed = true;
      }
    }
  }

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++)
      if (grid[r][c] === "") grid[r][c] = letters[Math.floor(Math.random() * letters.length)];

  return { grid, placedWords, tema: config.tema, difficulty: config.difficulty, hideWordList: !!config.hideWordList };
}
