export type Difficulty = "facil" | "medio" | "dificil";

export type GridSize = "10x10" | "15x15" | "20x20";

export type MazeStyle = "square" | "circular" | "hexagonal";

export type CryptoSymbolTheme = "math" | "emoji" | "tech" | "random";

export type SudokuContentType = "numbers" | "shapes" | "words";

export type ColorMode = "color" | "grayscale";

export interface GameHeader {
  showHeader: boolean;
  logoUrl: string;
  escola: string;
  professor: string;
  disciplina: string;
  aluno: string;
  data: string;
  serie: string;
}

export interface GameConfig {
  tema: string;
  palavras: string;
  difficulty: Difficulty;
  header: GameHeader;
  colorMode: ColorMode;

  // Word Search specific
  gridSize?: GridSize;
  hideWordList?: boolean;

  // Crossword specific
  hintStyle?: "text" | "synonym" | "fill-blank";

  // Cryptogram specific
  symbolTheme?: CryptoSymbolTheme;

  // Sudoku specific
  sudokuSize?: 4 | 6 | 9;
  sudokuContentType?: SudokuContentType;
  sudokuCustomSymbols?: string[];

  // Maze specific
  mazeStyle?: MazeStyle;
  mazeQuestions?: { question: string; alternatives: string[]; correctIndex: number }[];

  // AI enrichment fields
  _aiHints?: { palavra: string; dica: string }[];
  _aiCryptogramMessage?: string;
}

export const difficultyConfig: Record<Difficulty, { label: string; fontSize: string; gridSize: number; wordCount: number }> = {
  facil: { label: "Fácil (1º-5º ano)", fontSize: "14pt", gridSize: 10, wordCount: 8 },
  medio: { label: "Médio (6º-9º ano)", fontSize: "12pt", gridSize: 15, wordCount: 12 },
  dificil: { label: "Difícil (Ensino Médio)", fontSize: "10pt", gridSize: 20, wordCount: 16 },
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
