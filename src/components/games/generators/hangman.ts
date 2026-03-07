import type { GameConfig } from "../types";

export interface HangmanItem {
  word: string;
  hint: string;
}

export interface HangmanData {
  items: HangmanItem[];
  tema: string;
}

export function generateHangman(config: GameConfig): HangmanData {
  const words = config.palavras.split(",").map(w => w.trim()).filter(Boolean).slice(0, 6);
  const items = words.map(w => ({
    word: w.toUpperCase(),
    hint: `Relacionado a ${config.tema}`,
  }));
  return { items, tema: config.tema };
}
