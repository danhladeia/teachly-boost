import type { GameConfig, CryptoSymbolTheme } from "../types";

export interface CryptogramData {
  cipherTable: { letter: string; code: string }[];
  encodedMessage: { code: string; letter: string }[];
  tema: string;
  isComplex: boolean;
}

const SYMBOL_SETS: Record<CryptoSymbolTheme, string[]> = {
  math: ["∑", "∆", "π", "√", "∞", "±", "÷", "×", "≈", "≠", "≤", "≥", "∫", "Ω", "θ", "φ", "λ", "μ", "σ", "α", "β", "γ", "δ", "ε", "ζ", "η"],
  emoji: ["★", "♥", "♦", "♣", "♠", "☀", "☁", "☂", "♪", "♫", "✿", "✦", "⚡", "☺", "✉", "⚙", "☯", "⚛", "♻", "⚽", "✈", "⛵", "⚓", "✪", "♛", "♞"],
  tech: ["⌘", "⌥", "⇧", "⌫", "⏎", "⎋", "⌀", "⏏", "⚙", "#", "@", "&", "$", "%", "^", "~", "|", "\\", "/", "<", ">", "{", "}", "[", "]", "!"],
  random: [], // will use numbers
};

export function generateCryptogram(config: GameConfig): CryptogramData {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const theme = config.symbolTheme || "random";
  const isComplex = config.difficulty === "dificil";

  let codes: string[];
  if (theme === "random" || SYMBOL_SETS[theme].length < 26) {
    if (isComplex) {
      // Complex: simple math equations like "2+1", "5-2", etc.
      codes = Array.from({ length: 26 }, (_, i) => {
        const val = i + 1;
        const ops = [
          `${val + 3}-3`,
          `${val - 1}+1`,
          `${Math.floor(val / 2)}×2${val % 2 ? "+1" : ""}`,
        ];
        return ops[Math.floor(Math.random() * ops.length)];
      });
    } else {
      codes = Array.from({ length: 26 }, (_, i) => String(i + 1));
    }
  } else {
    codes = [...SYMBOL_SETS[theme]].slice(0, 26);
  }

  // Shuffle codes
  for (let i = codes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [codes[i], codes[j]] = [codes[j], codes[i]];
  }

  const cipherTable = alphabet.split("").map((l, i) => ({ letter: l, code: codes[i] }));

  const message = (config._aiCryptogramMessage || config.tema || "MENSAGEM SECRETA").toUpperCase().replace(/[^A-Z ]/g, "");
  const encodedMessage = message.split("").map(ch => {
    if (ch === " ") return { code: " ", letter: " " };
    const entry = cipherTable.find(c => c.letter === ch);
    return { code: entry?.code || "?", letter: ch };
  });

  return { cipherTable, encodedMessage, tema: config.tema, isComplex };
}
