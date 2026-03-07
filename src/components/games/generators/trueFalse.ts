import type { GameConfig } from "../types";

export interface TrueFalseItem {
  statement: string;
}

export interface TrueFalseData {
  items: TrueFalseItem[];
  tema: string;
}

export function generateTrueFalse(config: GameConfig): TrueFalseData {
  const words = config.palavras.split(",").map(w => w.trim()).filter(Boolean);
  const count = config.difficulty === "facil" ? 5 : config.difficulty === "medio" ? 8 : 10;
  const items: TrueFalseItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      statement: words[i] ? `${words[i]} está relacionado ao tema ${config.tema}.` : `Afirmação ${i + 1} sobre ${config.tema}.`,
    });
  }
  return { items, tema: config.tema };
}
