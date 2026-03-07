import type { GameConfig } from "../types";

export interface FillBlanksData {
  paragraphs: { text: string; blanks: string[] }[];
  tema: string;
}

export function generateFillBlanks(config: GameConfig): FillBlanksData {
  const words = config.palavras.split(",").map(w => w.trim()).filter(Boolean);
  const text = `O tema ${config.tema} é muito importante. Podemos destacar que ${words[0] || "______"} está relacionado com ${words[1] || "______"}. Além disso, ${words[2] || "______"} tem grande importância. No contexto de ${words[3] || "______"}, observamos que ${words[4] || "______"} desempenha um papel fundamental.`;

  return {
    paragraphs: [{
      text: text.replace(new RegExp(words.filter(Boolean).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|"), "gi"), "______"),
      blanks: words.slice(0, 5),
    }],
    tema: config.tema,
  };
}
