import type { GameConfig } from "../types";

export interface AnagramItem {
  scrambled: string;
  original: string;
}

export interface AnagramData {
  items: AnagramItem[];
  tema: string;
}

function shuffle(str: string): string {
  const arr = str.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join("");
  return result === str ? shuffle(str) : result;
}

export function generateAnagram(config: GameConfig): AnagramData {
  const words = config.palavras.split(",").map(w => w.trim().toUpperCase()).filter(w => w.length > 2);
  const items = words.map(w => ({ scrambled: shuffle(w), original: w }));
  return { items, tema: config.tema };
}
