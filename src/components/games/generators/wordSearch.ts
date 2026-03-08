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
  miniText?: string; // mini-text with words in UPPERCASE
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

function generateMiniText(words: string[], tema: string): string {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  
  // Much richer, varied pedagogical templates
  const templates = [
    // Narrative style
    () => {
      const w = shuffled.map(w => w.toUpperCase());
      if (w.length <= 3) {
        return `Durante a aula sobre ${tema}, a professora explicou a importância de ${w.join(" e ")}. Agora é sua vez de encontrar essas palavras no caça-palavras!`;
      }
      const mid = Math.ceil(w.length / 2);
      const p1 = w.slice(0, mid);
      const p2 = w.slice(mid);
      return `Hoje vamos estudar sobre ${tema}! Na primeira parte da aula, aprendemos sobre ${p1.join(", ")}. Depois, descobrimos que ${p2.slice(0, -1).join(", ")} e ${p2[p2.length - 1]} também são fundamentais para compreender esse assunto. Encontre todas essas palavras no caça-palavras abaixo!`;
    },
    // Question-driven style
    () => {
      const w = shuffled.map(w => w.toUpperCase());
      if (w.length <= 3) {
        return `Você sabia que, quando estudamos ${tema}, precisamos entender conceitos como ${w.join(" e ")}? Procure essas palavras no caça-palavras!`;
      }
      const half = Math.ceil(w.length / 2);
      return `Você já ouviu falar sobre ${tema}? Para compreender esse assunto, é essencial conhecer termos como ${w.slice(0, half).join(", ")}. Mas não para por aí! Também precisamos saber sobre ${w.slice(half, -1).join(", ")} e ${w[w.length - 1]}. Encontre todas no caça-palavras e descubra o quanto você já sabe!`;
    },
    // Explorer style
    () => {
      const w = shuffled.map(w => w.toUpperCase());
      if (w.length <= 3) {
        return `Prepare-se para uma aventura pelo mundo de ${tema}! Nesta exploração, você vai encontrar ${w.join(", ")}. Localize cada palavra escondida no caça-palavras!`;
      }
      const third = Math.ceil(w.length / 3);
      const p1 = w.slice(0, third);
      const p2 = w.slice(third, third * 2);
      const p3 = w.slice(third * 2);
      return `Embarque em uma jornada pelo universo de ${tema}! No primeiro trecho, você encontrará ${p1.join(" e ")}. Continuando a exploração, surgem ${p2.join(", ")}. E na reta final, descubra ${p3.join(" e ")}. Agora, localize todas essas palavras no caça-palavras!`;
    },
    // Didactic style
    () => {
      const w = shuffled.map(w => w.toUpperCase());
      if (w.length <= 3) {
        return `Na aula de hoje sobre ${tema}, vamos revisar conceitos importantes: ${w.join(", ")}. Encontre cada um deles no caça-palavras para fixar o conteúdo!`;
      }
      const half = Math.ceil(w.length / 2);
      return `Para dominar o conteúdo de ${tema}, é necessário conhecer alguns termos-chave. Começamos com ${w.slice(0, half).join(", ")}, que formam a base do assunto. Em seguida, aprofundamos com ${w.slice(half, -1).join(", ")} e ${w[w.length - 1]}. Encontre cada palavra no caça-palavras e fortaleça seu aprendizado!`;
    },
    // Challenge style
    () => {
      const w = shuffled.map(w => w.toUpperCase());
      if (w.length <= 3) {
        return `Desafio sobre ${tema}! Será que você consegue encontrar ${w.join(", ")} escondidas no caça-palavras? Mãos à obra!`;
      }
      return `Aceite o desafio! No tema ${tema}, existem ${w.length} palavras-chave escondidas neste caça-palavras: ${w.slice(0, -1).join(", ")} e ${w[w.length - 1]}. Quanto tempo você vai levar para encontrar todas? Boa sorte!`;
    },
  ];

  const template = templates[Math.floor(Math.random() * templates.length)];
  return template();
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

  // Generate mini-text if requested
  let miniText: string | undefined;
  if (config.miniText && placedWords.length > 0) {
    miniText = generateMiniText(placedWords, config.tema);
  }

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
    miniText,
  };
}
