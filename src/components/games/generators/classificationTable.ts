import type { GameConfig } from "../types";

export interface ClassificationTableData {
  headers: string[];
  items: string[];
  tema: string;
}

export function generateClassificationTable(config: GameConfig): ClassificationTableData {
  const words = config.palavras.split(",").map(w => w.trim()).filter(Boolean);
  return {
    headers: ["Categoria A", "Categoria B", "Categoria C"],
    items: words.length > 0 ? words : ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5", "Item 6"],
    tema: config.tema,
  };
}
