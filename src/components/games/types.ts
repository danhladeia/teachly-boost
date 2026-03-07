export type Difficulty = "facil" | "medio" | "dificil";

export interface GameHeader {
  showHeader: boolean;
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
  // AI enrichment fields (populated when generating with AI)
  _aiHints?: { palavra: string; dica: string }[];
  _aiHangmanItems?: { word: string; hint: string }[];
  _aiPairs?: { left: string; right: string }[];
  _aiCryptogramMessage?: string;
  _aiFillText?: string;
  _aiFillWords?: string[];
  _aiHeaders?: string[];
  _aiTrueFalseItems?: { statement: string; answer: boolean; justification: string }[];
  _aiSequenceItems?: { sequence: string[]; answer: string; type: string }[];
}

export interface GameModule {
  id: string;
  title: string;
  icon: string;
  desc: string;
  category: "words" | "logic" | "grid" | "text";
  needsWords?: boolean;
  needsTema?: boolean;
  generate: (config: GameConfig) => any;
  render: (data: any, config: GameConfig, onEdit?: (path: string, value: string) => void) => React.ReactNode;
}

export const difficultyConfig: Record<Difficulty, { label: string; fontSize: string; gridSize: number; wordCount: number }> = {
  facil: { label: "Fácil (1º-5º ano)", fontSize: "16pt", gridSize: 8, wordCount: 6 },
  medio: { label: "Médio (6º-9º ano)", fontSize: "12pt", gridSize: 12, wordCount: 10 },
  dificil: { label: "Difícil (Ensino Médio)", fontSize: "10pt", gridSize: 18, wordCount: 15 },
};

export const defaultHeader: GameHeader = {
  showHeader: false,
  escola: "",
  professor: "",
  disciplina: "",
  aluno: "",
  data: "",
  serie: "",
};
