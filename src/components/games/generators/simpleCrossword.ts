import type { GameConfig } from "../types";

export interface SimpleCrosswordData {
  size: number;
  tema: string;
  words: string[];
}

export function generateSimpleCrossword(config: GameConfig): SimpleCrosswordData {
  const words = config.palavras.split(",").map(w => w.trim().toUpperCase()).filter(Boolean).slice(0, 10);
  return { size: 10, tema: config.tema, words };
}
