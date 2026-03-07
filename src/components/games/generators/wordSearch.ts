import type { GameConfig, Difficulty } from "../types";
import { difficultyConfig } from "../types";

export interface WordSearchData {
  grid: string[][];
  placedWords: string[];
  tema: string;
  difficulty: Difficulty;
}

export function generateWordSearch(config: GameConfig): WordSearchData {
  const wordList = config.palavras.split(",").map(w => w.trim().toUpperCase().replace(/[^A-ZÁÉÍÓÚÂÊÔÃÕÇ]/g, "")).filter(w => w.length > 0);
  const dc = difficultyConfig[config.difficulty];
  const gridSize = dc.gridSize;
  const grid: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(""));
  const directions = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]];
  const placedWords: string[] = [];
  const sorted = [...wordList].sort((a, b) => b.length - a.length).slice(0, dc.wordCount);

  for (const word of sorted) {
    if (word.length > gridSize) continue;
    let placed = false;
    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
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

  return { grid, placedWords, tema: config.tema, difficulty: config.difficulty };
}
