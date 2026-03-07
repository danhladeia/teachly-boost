import type { GameConfig, CryptoSymbolTheme, CryptoCipherType } from "../types";

export interface CryptogramData {
  cipherTable: { letter: string; code: string }[];
  encodedMessage: { code: string; letter: string }[];
  tema: string;
  isComplex: boolean;
  cipherType: string;
  showTable: string;
  answer: string; // for answer key
}

const SYMBOL_SETS: Record<CryptoSymbolTheme, string[]> = {
  math: ["∑", "∆", "π", "√", "∞", "±", "÷", "×", "≈", "≠", "≤", "≥", "∫", "Ω", "θ", "φ", "λ", "μ", "σ", "α", "β", "γ", "δ", "ε", "ζ", "η"],
  emoji: ["★", "♥", "♦", "♣", "♠", "☀", "☁", "☂", "♪", "♫", "✿", "✦", "⚡", "☺", "✉", "⚙", "☯", "⚛", "♻", "⚽", "✈", "⛵", "⚓", "✪", "♛", "♞"],
  tech: ["⌘", "⌥", "⇧", "⌫", "⏎", "⎋", "⌀", "⏏", "⚙", "#", "@", "&", "$", "%", "^", "~", "|", "\\", "/", "<", ">", "{", "}", "[", "]", "!"],
  geometric: ["▲", "●", "■", "◆", "▼", "○", "□", "◇", "△", "◉", "◐", "◑", "◒", "◓", "⬟", "⬡", "⬢", "⬣", "⬤", "⬥", "⬦", "⬧", "⬨", "⬩", "⬪", "⬫"],
  random: [],
};

function caesarEncode(letter: string, shift: number): string {
  const code = letter.charCodeAt(0) - 65;
  return String.fromCharCode(((code + shift) % 26) + 65);
}

export function generateCryptogram(config: GameConfig): CryptogramData {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const theme = config.symbolTheme || "random";
  const cipherType = config.cipherType || "numeric";
  const showTable = config.showCipherTable || "full";
  const isComplex = config.difficulty === "dificil";

  let codes: string[];

  if (cipherType === "caesar") {
    const shift = config.caesarShift || 3;
    codes = alphabet.split("").map(l => caesarEncode(l, shift));
  } else if (cipherType === "math") {
    codes = Array.from({ length: 26 }, (_, i) => {
      const val = i + 1;
      const ops = [`${val + 3}-3`, `${val - 1}+1`, `${Math.floor(val / 2)}×2${val % 2 ? "+1" : ""}`];
      return ops[Math.floor(Math.random() * ops.length)];
    });
  } else if (theme !== "random" && SYMBOL_SETS[theme].length >= 26) {
    codes = [...SYMBOL_SETS[theme]].slice(0, 26);
    // Shuffle
    for (let i = codes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [codes[i], codes[j]] = [codes[j], codes[i]];
    }
  } else {
    codes = Array.from({ length: 26 }, (_, i) => String(i + 1));
  }

  // Shuffle for substitution types
  if (cipherType === "substitution" || cipherType === "numeric") {
    for (let i = codes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [codes[i], codes[j]] = [codes[j], codes[i]];
    }
  }

  const cipherTable = alphabet.split("").map((l, i) => ({ letter: l, code: codes[i] }));

  const message = (config._aiCryptogramMessage || config.tema || "MENSAGEM SECRETA").toUpperCase().replace(/[^A-Z ]/g, "");
  const encodedMessage = message.split("").map(ch => {
    if (ch === " ") return { code: " ", letter: " " };
    const entry = cipherTable.find(c => c.letter === ch);
    return { code: entry?.code || "?", letter: ch };
  });

  // For partial table, only show some entries
  const displayTable = showTable === "partial"
    ? cipherTable.filter((_, i) => i % 2 === 0 || Math.random() > 0.5)
    : cipherTable;

  return {
    cipherTable: showTable === "hidden" ? [] : displayTable,
    encodedMessage,
    tema: config.tema,
    isComplex,
    cipherType,
    showTable,
    answer: message,
  };
}
