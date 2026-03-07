import type { GameConfig, GridSize, WordSearchDirections } from "../types";

export interface WordSearchData {
  grid: string[][];
  placedWords: string[];
  allWords: string[]; // includes bonus words info
  tema: string;
  hideWordList: boolean;
  wordListPosition: string;
  wordListOrder: string;
  cellFormat: string;
  letterCase: string;
  spacing: number;
}

function getGridSizeNum(gridSize?: GridSize): number {
  if (!gridSize) return 10;
  const map: Record<GridSize, number> = { "8x8": 8, "10x10": 10, "12x12": 12, "15x15": 15, "18x18": 18, "20x20": 20 };
  return map[gridSize];
}

function getDirectionsArray(dirs: WordSearchDirections): number[][] {
  const result: number[][] = [];
  if (dirs.horizontal) result.push([0, 1]);
  if (dirs.vertical) result.push([1, 0]);
  if (dirs.diagonalDown) result.push([1, 1]);
  if (dirs.diagonalUp) result.push([-1, 1]);
  if (dirs.reversed) {
    if (dirs.horizontal) result.push([0, -1]);
    if (dirs.vertical) result.push([-1, 0]);
    if (dirs.diagonalDown) result.push([-1, -1]);
    if (dirs.diagonalUp) result.push([1, -1]);
  }
  if (result.length === 0) result.push([0, 1]); // fallback
  return result;
}

function applyLetterCase(word: string, letterCase: string): string {
  switch (letterCase) {
    case "lower": return word.toLowerCase();
    case "capitalize": return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    default: return word.toUpperCase();
  }
}

export function generateWordSearch(config: GameConfig): WordSearchData {
  const gridSize = getGridSizeNum(config.gridSize);
  const dirs = config.directions || { horizontal: true, vertical: true, diagonalDown: false, diagonalUp: false, reversed: false };
  const directions = getDirectionsArray(dirs);
  const lCase = config.letterCase || "upper";

  const wordList = config.palavras
    .split(",")
    .map(w => w.trim().toUpperCase().replace(/[^A-ZÁÉÍÓÚÂÊÔÃÕÇ]/g, ""))
    .filter(w => w.length > 1 && w.length <= gridSize);

  const grid: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(""));
  const placedWords: string[] = [];
  const sorted = [...wordList].sort((a, b) => b.length - a.length).slice(0, 25);

  for (const word of sorted) {
    let placed = false;
    for (let attempt = 0; attempt < 400 && !placed; attempt++) {
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

  // Apply letter case to grid
  if (lCase !== "upper") {
    for (let r = 0; r < gridSize; r++)
      for (let c = 0; c < gridSize; c++)
        grid[r][c] = applyLetterCase(grid[r][c], lCase);
  }

  const displayWords = placedWords.map(w => applyLetterCase(w, lCase));
  const order = config.wordListOrder || "alphabetical";
  const orderedWords = order === "alphabetical" ? [...displayWords].sort() : order === "shuffled" ? [...displayWords].sort(() => Math.random() - 0.5) : displayWords;

  return {
    grid,
    placedWords: orderedWords,
    allWords: placedWords,
    tema: config.tema,
    hideWordList: config.wordListPosition === "hidden" || !!config.hideWordList,
    wordListPosition: config.wordListPosition || "below",
    wordListOrder: order,
    cellFormat: config.cellFormat || "square",
    letterCase: lCase,
    spacing: config.spacing || 1,
  };
}
