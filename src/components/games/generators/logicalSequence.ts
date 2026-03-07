import type { GameConfig, Difficulty } from "../types";

export interface SequenceItem {
  sequence: string[];
  answer: string;
  type: "number" | "letter" | "pattern";
}

export interface LogicalSequenceData {
  items: SequenceItem[];
  tema: string;
}

export function generateLogicalSequence(config: GameConfig): LogicalSequenceData {
  const count = config.difficulty === "facil" ? 5 : config.difficulty === "medio" ? 8 : 10;
  const items: SequenceItem[] = [];

  for (let i = 0; i < count; i++) {
    const type = i % 3 === 0 ? "number" : i % 3 === 1 ? "letter" : "pattern";
    if (type === "number") {
      const start = Math.floor(Math.random() * 10) + 1;
      const step = Math.floor(Math.random() * 5) + 2;
      const seq = Array.from({ length: 5 }, (_, k) => String(start + step * k));
      const answer = String(start + step * 5);
      items.push({ sequence: [...seq, "?"], answer, type });
    } else if (type === "letter") {
      const startCode = 65 + Math.floor(Math.random() * 20);
      const step = Math.floor(Math.random() * 3) + 1;
      const seq = Array.from({ length: 5 }, (_, k) => String.fromCharCode(startCode + step * k));
      const answer = String.fromCharCode(startCode + step * 5);
      items.push({ sequence: [...seq, "?"], answer, type });
    } else {
      const shapes = ["●", "■", "▲", "◆", "★"];
      const pattern = [shapes[i % 5], shapes[(i + 1) % 5], shapes[(i + 2) % 5]];
      const seq = [...pattern, ...pattern.slice(0, 2)];
      items.push({ sequence: [...seq, "?"], answer: pattern[2], type });
    }
  }

  return { items, tema: config.tema };
}
