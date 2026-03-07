import type { GameConfig } from "../types";

export interface CryptogramData {
  cipherTable: { letter: string; code: string }[];
  encodedMessage: { code: string; letter: string }[];
  tema: string;
}

export function generateCryptogram(config: GameConfig): CryptogramData {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const codes = Array.from({ length: 26 }, (_, i) => String(i + 1));
  // Shuffle codes
  for (let i = codes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [codes[i], codes[j]] = [codes[j], codes[i]];
  }
  const cipherTable = alphabet.split("").map((l, i) => ({ letter: l, code: codes[i] }));

  const message = (config.tema || "MENSAGEM SECRETA").toUpperCase();
  const encodedMessage = message.split("").map(ch => {
    if (ch === " ") return { code: " ", letter: " " };
    const entry = cipherTable.find(c => c.letter === ch);
    return { code: entry?.code || "?", letter: ch };
  });

  return { cipherTable, encodedMessage, tema: config.tema };
}
