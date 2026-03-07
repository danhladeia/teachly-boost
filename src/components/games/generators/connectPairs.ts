import type { GameConfig } from "../types";

export interface PairItem {
  left: string;
  right: string;
}

export interface ConnectPairsData {
  pairs: PairItem[];
  shuffledRight: string[];
  tema: string;
}

export function generateConnectPairs(config: GameConfig): ConnectPairsData {
  const words = config.palavras.split(",").map(w => w.trim()).filter(Boolean);
  const pairs: PairItem[] = [];
  for (let i = 0; i < words.length - 1; i += 2) {
    pairs.push({ left: words[i], right: words[i + 1] || `Resposta ${i + 1}` });
  }
  if (pairs.length === 0) {
    pairs.push({ left: "Item A", right: "Par A" }, { left: "Item B", right: "Par B" }, { left: "Item C", right: "Par C" });
  }
  const shuffledRight = [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5);
  return { pairs, shuffledRight, tema: config.tema };
}
