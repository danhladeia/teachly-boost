export type Difficulty = "facil" | "medio" | "dificil";
export type EtapaEscolar = "iniciais" | "finais" | "medio";
export type EditorMode = "quick" | "advanced";
export type GridSize = "8x8" | "10x10" | "12x12" | "15x15" | "18x18" | "20x20";
export type MazeStyle = "square" | "circular" | "hexagonal";
export type CryptoSymbolTheme = "math" | "emoji" | "tech" | "geometric" | "random";
export type CryptoCipherType = "substitution" | "caesar" | "numeric" | "math" | "vigenere";
export type SudokuContentType = "numbers" | "shapes" | "words" | "letters" | "emojis";
export type ColorMode = "color" | "grayscale" | "high-contrast";
export type WordListPosition = "below" | "side" | "above" | "hidden";
export type WordListOrder = "alphabetical" | "shuffled" | "category";
export type CellFormat = "square" | "circle" | "none";
export type LetterCase = "upper" | "lower" | "capitalize";
export type FontStyle = "print" | "cursive" | "serif";
export type AnswerKeyMode = "none" | "separate" | "back";

export interface GameHeader {
  showHeader: boolean;
  logoUrl: string;
  bannerUrl?: string;
  escola: string;
  professor: string;
  disciplina: string;
  aluno: string;
  data: string;
  serie: string;
}

// Direction flags for word search
export interface WordSearchDirections {
  horizontal: boolean;
  vertical: boolean;
  diagonalDown: boolean;
  diagonalUp: boolean;
  reversed: boolean;
}

export interface GameConfig {
  tema: string;
  palavras: string;
  difficulty: Difficulty;
  etapa: EtapaEscolar;
  header: GameHeader;
  colorMode: ColorMode;
  answerKey: AnswerKeyMode;
  customInstructions?: string;

  // Word Search specific
  gridSize?: GridSize;
  hideWordList?: boolean;
  wordListPosition?: WordListPosition;
  wordListOrder?: WordListOrder;
  directions?: WordSearchDirections;
  cellFormat?: CellFormat;
  letterCase?: LetterCase;
  fontStyle?: FontStyle;
  spacing?: number; // 0.8 to 1.5
  bonusWords?: number;
  miniText?: boolean; // generate a mini-text with words in CAPS

  // Crossword specific
  hintStyle?: "text" | "synonym" | "fill-blank" | "question" | "riddle";
  crosswordMaxSize?: number;
  crosswordSymmetry?: "symmetric" | "asymmetric" | "radial";
  mysteryWord?: string;

  // Cryptogram specific
  symbolTheme?: CryptoSymbolTheme;
  cipherType?: CryptoCipherType;
  caesarShift?: number;
  vigenereKey?: string;
  showCipherTable?: "full" | "partial" | "hidden";
  phraseLength?: "short" | "medium" | "long";

  // Sudoku specific
  sudokuSize?: 4 | 6 | 8 | 9;
  sudokuContentType?: SudokuContentType;
  sudokuCustomSymbols?: string[];
  sudokuFillPercent?: number; // 20-80
  sudokuCount?: number; // puzzles per page
  sudokuShowScratch?: boolean;

  // Maze specific
  mazeStyle?: MazeStyle;
  mazeQuestions?: { question: string; alternatives: string[]; correctIndex: number }[];
  mazeComplexity?: number; // 1-5
  mazeSize?: "small" | "medium" | "large";
  mazeQuestionType?: "multiple" | "true-false" | "open";

  // AI enrichment fields
  _aiHints?: { palavra: string; dica: string }[];
  _aiCryptogramMessage?: string;
}

// Etapa-based defaults per game and difficulty
export interface EtapaDefaults {
  gridSize: GridSize;
  directions: WordSearchDirections;
  wordCount: number;
  fontSize: string;
  cellSize?: number;
}

const WS_DEFAULTS: Record<EtapaEscolar, Record<Difficulty, EtapaDefaults>> = {
  iniciais: {
    facil: { gridSize: "8x8", directions: { horizontal: true, vertical: false, diagonalDown: false, diagonalUp: false, reversed: false }, wordCount: 5, fontSize: "24pt" },
    medio: { gridSize: "10x10", directions: { horizontal: true, vertical: true, diagonalDown: false, diagonalUp: false, reversed: false }, wordCount: 7, fontSize: "20pt" },
    dificil: { gridSize: "12x12", directions: { horizontal: true, vertical: true, diagonalDown: true, diagonalUp: false, reversed: false }, wordCount: 9, fontSize: "18pt" },
  },
  finais: {
    facil: { gridSize: "12x12", directions: { horizontal: true, vertical: true, diagonalDown: false, diagonalUp: false, reversed: false }, wordCount: 11, fontSize: "14pt" },
    medio: { gridSize: "15x15", directions: { horizontal: true, vertical: true, diagonalDown: true, diagonalUp: true, reversed: false }, wordCount: 14, fontSize: "12pt" },
    dificil: { gridSize: "18x18", directions: { horizontal: true, vertical: true, diagonalDown: true, diagonalUp: true, reversed: false }, wordCount: 17, fontSize: "11pt" },
  },
  medio: {
    facil: { gridSize: "15x15", directions: { horizontal: true, vertical: true, diagonalDown: true, diagonalUp: false, reversed: false }, wordCount: 15, fontSize: "11pt" },
    medio: { gridSize: "18x18", directions: { horizontal: true, vertical: true, diagonalDown: true, diagonalUp: true, reversed: false }, wordCount: 19, fontSize: "10pt" },
    dificil: { gridSize: "20x20", directions: { horizontal: true, vertical: true, diagonalDown: true, diagonalUp: true, reversed: true }, wordCount: 23, fontSize: "10pt" },
  },
};

export function getWordSearchDefaults(etapa: EtapaEscolar, difficulty: Difficulty): EtapaDefaults {
  return WS_DEFAULTS[etapa][difficulty];
}

export const difficultyConfig: Record<Difficulty, { label: string; fontSize: string; gridSize: number; wordCount: number }> = {
  facil: { label: "Fácil", fontSize: "14pt", gridSize: 10, wordCount: 8 },
  medio: { label: "Médio", fontSize: "12pt", gridSize: 15, wordCount: 12 },
  dificil: { label: "Difícil", fontSize: "10pt", gridSize: 20, wordCount: 16 },
};

export const etapaConfig: Record<EtapaEscolar, { label: string; icon: string; desc: string }> = {
  iniciais: { label: "Anos Iniciais", icon: "🧒", desc: "1º ao 5º ano" },
  finais: { label: "Anos Finais", icon: "👦", desc: "6º ao 9º ano" },
  medio: { label: "Ensino Médio", icon: "🎓", desc: "1º ao 3º ano" },
};

export const defaultHeader: GameHeader = {
  showHeader: false,
  logoUrl: "",
  escola: "",
  professor: "",
  disciplina: "",
  aluno: "",
  data: "",
  serie: "",
};

export const defaultDirections: WordSearchDirections = {
  horizontal: true,
  vertical: true,
  diagonalDown: false,
  diagonalUp: false,
  reversed: false,
};
