import type { GameConfig, Difficulty } from "../types";

export interface CrosswordCell {
  letter: string;
  number?: number;
  empty: boolean;
}

export interface CrosswordClue {
  number: number;
  word: string;
  hint: string;
  direction: "across" | "down";
  row: number;
  col: number;
}

export interface CrosswordData {
  grid: CrosswordCell[][];
  clues: CrosswordClue[];
  size: number;
  tema: string;
}

export function generateCrossword(config: GameConfig): CrosswordData {
  const size = config.difficulty === "facil" ? 10 : config.difficulty === "medio" ? 13 : 16;
  const words = config.palavras
    .split(",")
    .map(w => w.trim().toUpperCase().replace(/[^A-ZÁÉÍÓÚÂÊÔÃÕÇ]/g, ""))
    .filter(w => w.length > 1 && w.length <= size);
  const sorted = [...words].sort((a, b) => b.length - a.length).slice(0, 12);

  const grid: CrosswordCell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ letter: "", empty: true, number: undefined }))
  );
  const clues: CrosswordClue[] = [];
  let clueNum = 1;

  const hintMap = new Map<string, string>();
  if (config._aiHints) {
    config._aiHints.forEach(h => hintMap.set(h.palavra?.toUpperCase(), h.dica));
  }

  function getHint(word: string, idx: number): string {
    return hintMap.get(word) || `Palavra ${idx + 1} sobre ${config.tema}`;
  }

  if (sorted.length > 0) {
    // Place first word horizontally in center
    const first = sorted[0];
    const startRow = Math.floor(size / 2);
    const startCol = Math.floor((size - first.length) / 2);
    for (let i = 0; i < first.length; i++) {
      grid[startRow][startCol + i] = { letter: first[i], empty: false, number: i === 0 ? clueNum : undefined };
    }
    clues.push({ number: clueNum++, word: first, hint: getHint(first, 0), direction: "across", row: startRow, col: startCol });

    for (let wi = 1; wi < sorted.length; wi++) {
      const word = sorted[wi];
      let placed = false;
      const tryDir = wi % 2 === 1 ? "down" : "across";

      for (let ci = 0; ci < word.length && !placed; ci++) {
        for (let r = 0; r < size && !placed; r++) {
          for (let c = 0; c < size && !placed; c++) {
            if (grid[r][c].letter !== word[ci] || grid[r][c].empty) continue;

            if (tryDir === "down") {
              const startR = r - ci;
              if (startR < 0 || startR + word.length > size) continue;
              let fits = true;
              for (let k = 0; k < word.length; k++) {
                const cell = grid[startR + k][c];
                if (k === ci) continue;
                if (!cell.empty && cell.letter !== word[k]) { fits = false; break; }
                if (cell.empty) {
                  if (c > 0 && !grid[startR + k][c - 1].empty) { fits = false; break; }
                  if (c < size - 1 && !grid[startR + k][c + 1].empty) { fits = false; break; }
                }
              }
              if (fits) {
                for (let k = 0; k < word.length; k++) {
                  const existing = grid[startR + k][c];
                  grid[startR + k][c] = { letter: word[k], empty: false, number: k === 0 ? clueNum : existing.number };
                }
                clues.push({ number: clueNum++, word, hint: getHint(word, wi), direction: "down", row: startR, col: c });
                placed = true;
              }
            } else {
              const startC = c - ci;
              if (startC < 0 || startC + word.length > size) continue;
              let fits = true;
              for (let k = 0; k < word.length; k++) {
                const cell = grid[r][startC + k];
                if (k === ci) continue;
                if (!cell.empty && cell.letter !== word[k]) { fits = false; break; }
                if (cell.empty) {
                  if (r > 0 && !grid[r - 1][startC + k].empty) { fits = false; break; }
                  if (r < size - 1 && !grid[r + 1][startC + k].empty) { fits = false; break; }
                }
              }
              if (fits) {
                for (let k = 0; k < word.length; k++) {
                  const existing = grid[r][startC + k];
                  grid[r][startC + k] = { letter: word[k], empty: false, number: k === 0 ? clueNum : existing.number };
                }
                clues.push({ number: clueNum++, word, hint: getHint(word, wi), direction: "across", row: r, col: startC });
                placed = true;
              }
            }
          }
        }
      }
    }
  }

  return { grid, clues, size, tema: config.tema };
}
