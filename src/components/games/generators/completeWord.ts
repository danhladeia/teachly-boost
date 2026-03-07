import type { GameConfig } from "../types";

export interface CompleteWordItem {
  original: string;
  masked: string;
}

export interface CompleteWordData {
  items: CompleteWordItem[];
  tema: string;
}

export function generateCompleteWord(config: GameConfig): CompleteWordData {
  const words = config.palavras.split(",").map(w => w.trim().toUpperCase()).filter(Boolean);
  const items = words.map(w => {
    const chars = w.split("");
    const removeCount = Math.max(1, Math.floor(chars.length * 0.4));
    const indices = Array.from({ length: chars.length }, (_, i) => i).sort(() => Math.random() - 0.5).slice(0, removeCount);
    const masked = chars.map((c, i) => indices.includes(i) ? "_" : c).join("");
    return { original: w, masked };
  });
  return { items, tema: config.tema };
}
