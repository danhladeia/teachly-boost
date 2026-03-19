import { useState, useCallback, useEffect } from "react";
import ResponsiveA4Wrapper from "@/components/ResponsiveA4Wrapper";
import EditorTopBar from "@/components/EditorTopBar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Gamepad2, Search as SearchIcon, Grid3X3, Lock, MapPin,
  Sparkles, Loader2, RotateCcw, ArrowLeft,
  Wand2, Edit3, Zap, Settings2,
  HelpCircle, ChevronDown, ChevronUp, Eye, Monitor, Smartphone,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTimbre } from "@/hooks/useTimbre";
import TimbreSelector from "@/components/TimbreSelector";
import type { TimbreData } from "@/hooks/useTimbre";
import { useCredits } from "@/hooks/useCredits";
import { useDocumentLimits } from "@/hooks/useDocumentLimits";
import {
  defaultHeader, defaultDirections, etapaConfig, getWordSearchDefaults,
  type Difficulty, type EtapaEscolar, type EditorMode, type GameConfig, type GameHeader,
  type ColorMode, type GridSize, type CryptoSymbolTheme, type CryptoCipherType,
  type WordSearchDirections, type AnswerKeyMode,
} from "@/components/games/types";
import { generateWordSearch } from "@/components/games/generators/wordSearch";
import { generateCrossword } from "@/components/games/generators/crossword";
import { generateCryptogram } from "@/components/games/generators/cryptogram";
import { generateSudoku } from "@/components/games/generators/sudoku";
import { generateMaze } from "@/components/games/generators/maze";

import WordSearchPreview from "@/components/games/previews/WordSearchPreview";
import CrosswordPreview from "@/components/games/previews/CrosswordPreview";
import CryptogramPreview from "@/components/games/previews/CryptogramPreview";
import SudokuPreview from "@/components/games/previews/SudokuPreview";
import MazePreview from "@/components/games/previews/MazePreview";
import AnswerKeyPreview from "@/components/games/previews/AnswerKeyPreview";

const GAMES = [
  { id: "caca-palavras", title: "Caça-Palavras", icon: SearchIcon, desc: "Grade com palavras escondidas em múltiplas direções", needsWords: true, supportsAI: true },
  { id: "cruzadinha", title: "Palavras Cruzadas", icon: Grid3X3, desc: "Grade com dicas horizontais e verticais", needsWords: true, supportsAI: true },
  { id: "criptograma", title: "Criptograma Lógico", icon: Lock, desc: "Decifre a mensagem com tabela de códigos", needsWords: false, supportsAI: true },
  { id: "sudoku", title: "Sudoku Temático", icon: Grid3X3, desc: "Puzzles 4×4 a 9×9 com números ou símbolos", needsWords: false, supportsAI: false },
  { id: "labirinto", title: "Labirinto", icon: MapPin, desc: "Encontre o caminho da entrada à saída", needsWords: false, supportsAI: false },
];

function Tip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help inline ml-1" />
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[200px] text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors">
        {title}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-1">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export default function GameFactory() {
  const { user } = useAuth();
  const { timbre } = useTimbre();
  const docLimits = useDocumentLimits();
  const isMobile = useIsMobile();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [tema, setTema] = useState("");
  const [palavras, setPalavras] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("facil");
  const [etapa, setEtapa] = useState<EtapaEscolar>("finais");
  const [editorMode, setEditorMode] = useState<EditorMode>("quick");
  const [header, setHeader] = useState<GameHeader>({ ...defaultHeader });
  const [colorMode, setColorMode] = useState<ColorMode>("color");
  const [answerKey, setAnswerKey] = useState<AnswerKeyMode>("separate");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gameData, setGameData] = useState<any>(null);
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [customInstructions, setCustomInstructions] = useState("");
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [previewMode, setPreviewMode] = useState<"print" | "mobile">(isMobile ? "mobile" : "print");

  // Word Search
  const [gridSize, setGridSize] = useState<GridSize>("10x10");
  const [directions, setDirections] = useState<WordSearchDirections>({ ...defaultDirections });
  const [wordListPosition, setWordListPosition] = useState<string>("below");
  const [wordListOrder, setWordListOrder] = useState<string>("alphabetical");
  const [cellFormat, setCellFormat] = useState<string>("square");
  const [letterCase, setLetterCase] = useState<string>("upper");
  const [fontStyle, setFontStyle] = useState<string>("print");
  const [spacing, setSpacing] = useState(1);
  const [bonusWords, setBonusWords] = useState(0);
  const [miniText, setMiniText] = useState(false);

  // Crossword
  const [hintStyle, setHintStyle] = useState<string>("text");
  const [crosswordSymmetry, setCrosswordSymmetry] = useState<string>("symmetric");
  const [mysteryWord, setMysteryWord] = useState("");

  // Cryptogram
  const [symbolTheme, setSymbolTheme] = useState<CryptoSymbolTheme>("random");
  const [cipherType, setCipherType] = useState<CryptoCipherType>("numeric");
  const [caesarShift, setCaesarShift] = useState(3);
  const [vigenereKey, setVigenereKey] = useState("");
  const [showCipherTable, setShowCipherTable] = useState<string>("full");
  const [phraseLength, setPhraseLength] = useState<string>("medium");

  // Sudoku
  const [sudokuSize, setSudokuSize] = useState<4 | 6 | 8 | 9>(4);
  const [sudokuContentType, setSudokuContentType] = useState<string>("numbers");
  const [sudokuCustomSymbols, setSudokuCustomSymbols] = useState("");
  const [sudokuFillPercent, setSudokuFillPercent] = useState(60);
  const [sudokuCount, setSudokuCount] = useState(4);
  const [sudokuShowScratch, setSudokuShowScratch] = useState(false);

  // Maze
  const [mazeQuestions, setMazeQuestions] = useState<{ question: string; alternatives: string[]; correctIndex: number }[]>([]);
  const [mazeSize, setMazeSize] = useState<string>("medium");
  const [mazeQuestionType, setMazeQuestionType] = useState<string>("multiple");

  const selectedGameDef = GAMES.find(g => g.id === selectedGame);
  const isAdvanced = editorMode === "advanced";

  const [selectedTimbre, setSelectedTimbre] = useState<TimbreData | null>(null);

  // Sync selected timbre to header
  const handleTimbreSelect = (t: TimbreData | null) => {
    setSelectedTimbre(t);
    if (t) {
      setHeader(h => ({
        ...h,
        showHeader: true,
        escola: t.escola || h.escola,
        logoUrl: t.logoUrl || h.logoUrl,
        bannerUrl: t.bannerUrl || h.bannerUrl,
      }));
      return;
    }

    setHeader(h => ({
      ...h,
      logoUrl: "",
      bannerUrl: "",
    }));
  };

  // Always sync header with branding from Timbres e Branding
  useEffect(() => {
    setHeader(h => ({
      ...h,
      showHeader: h.showHeader || Boolean(timbre.escola || timbre.logoUrl || timbre.bannerUrl),
      escola: h.escola || timbre.escola || "",
      logoUrl: h.logoUrl || timbre.logoUrl || "",
      bannerUrl: h.bannerUrl || timbre.bannerUrl || "",
    }));
  }, [timbre]);

  useEffect(() => {
    if (isMobile) setPreviewMode("mobile");
  }, [isMobile]);

  // Helper to apply etapa defaults for caça-palavras
  const applyEtapaDefaults = (etapa: EtapaEscolar, diff: Difficulty) => {
    const defaults = getWordSearchDefaults(etapa, diff);
    setGridSize(defaults.gridSize);
    setDirections(defaults.directions);
  };

  // Generate game data
  const handleGenerate = useCallback(async () => {
    if (!selectedGameDef) return;
    setGenerating(true);
    setGameData(null);
    setShowAnswerKey(false);

    try {
      let data: any = null;
      const config: GameConfig = {
        tema,
        palavras,
        difficulty,
        etapa,
        editorMode,
        header,
        colorMode,
        customInstructions,
        gridSize,
        directions,
        wordListPosition,
        wordListOrder,
        cellFormat,
        letterCase,
        fontStyle,
        spacing,
        bonusWords,
        miniText,
        hintStyle,
        crosswordSymmetry,
        mysteryWord,
        symbolTheme,
        cipherType,
        caesarShift,
        vigenereKey,
        showCipherTable,
        phraseLength,
        sudokuSize,
        sudokuContentType,
        sudokuCustomSymbols,
        sudokuFillPercent,
        sudokuCount,
        sudokuShowScratch,
        mazeQuestions,
        mazeSize,
        mazeQuestionType,
      };

      if (selectedGame === "caca-palavras") {
        data = generateWordSearch(config);
      } else if (selectedGame === "cruzadinha") {
        data = generateCrossword(config);
      } else if (selectedGame === "criptograma") {
        data = generateCryptogram(config);
      } else if (selectedGame === "sudoku") {
        data = generateSudoku(config);
      } else if (selectedGame === "labirinto") {
        data = generateMaze(config);
      }

      setGameData(data);
    } catch (e) {
      toast.error("Erro ao gerar o jogo");
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }, [
    selectedGame,
    selectedGameDef,
    tema,
    palavras,
    difficulty,
    etapa,
    editorMode,
    header,
    colorMode,
    customInstructions,
    gridSize,
    directions,
    wordListPosition,
    wordListOrder,
    cellFormat,
    letterCase,
    fontStyle,
    spacing,
    bonusWords,
    miniText,
    hintStyle,
    crosswordSymmetry,
    mysteryWord,
    symbolTheme,
    cipherType,
    caesarShift,
    vigenereKey,
    showCipherTable,
    phraseLength,
    sudokuSize,
    sudokuContentType,
    sudokuCustomSymbols,
    sudokuFillPercent,
    sudokuCount,
    sudokuShowScratch,
    mazeQuestions,
    mazeSize,
    mazeQuestionType,
  ]);

  // Save game data (stub)
  const handleSave = async () => {
    setSaving(true);
    try {
      // Implement save logic here
      toast.success("Jogo salvo com sucesso");
    } catch {
      toast.error("Erro ao salvar o jogo");
    } finally {
      setSaving(false);
    }
  };

  // Print handler (stub)
  const handlePrint = () => {
    window.print();
  };

  // PDF export handler (stub)
  const handlePDF = () => {
    toast("Função de exportar PDF ainda não implementada");
  };

  // Render preview based on selected game and data
  const renderPreview = () => {
    if (!gameData || !selectedGame) return null;
    switch (selectedGame) {
      case "caca-palavras":
        return <WordSearchPreview data={gameData} config={getConfig()} />;
      case "cruzadinha":
        return <CrosswordPreview data={gameData} config={getConfig()} />;
      case "criptograma":
        return <CryptogramPreview data={gameData} config={getConfig()} />;
      case "sudoku":
        return <SudokuPreview data={gameData} config={getConfig()} />;
      case "labirinto":
        return <MazePreview data={gameData} config={getConfig()} />;
      default:
        return null;
    }
  };

  // Compose config object for previews
  const getConfig = (): GameConfig => ({
    tema,
    palavras,
    difficulty,
    etapa,
    editorMode,
    header,
    colorMode,
    customInstructions,
    gridSize,
    directions,
    wordListPosition,
    wordListOrder,
    cellFormat,
    letterCase,
    fontStyle,
    spacing,
    bonusWords,
    miniText,
    hintStyle,
    crosswordSymmetry,
    mysteryWord,
    symbolTheme,
    cipherType,
    caesarShift,
    vigenereKey,
    showCipherTable,
    phraseLength,
    sudokuSize,
    sudokuContentType,
    sudokuCustomSymbols,
    sudokuFillPercent,
    sudokuCount,
    sudokuShowScratch,
    mazeQuestions,
    mazeSize,
    mazeQuestionType,
  });

  // --- GAME SELECTOR ---
  if (!selectedGame) {
    return (
      <div className="space-y-6 overflow-x-hidden">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-primary" /> Criador de Jogos A4
          </h1>
          <p className="text-muted-foreground mt-1">Escolha um jogo pedagógico com o mesmo fluxo visual de criação das atividades.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map(game => (
            <Card
              key={game.id}
              className="shadow-card cursor-pointer transition-all hover:shadow-elevated hover:scale-[1.02]"
              onClick={() => {
                setSelectedGame(game.id);
                setGameData(null);
                setShowAnswerKey(false);
                setMode(game.supportsAI ? "ai" : "manual");
                applyEtapaDefaults(etapa, difficulty);
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <game.icon className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1">
                    {game.supportsAI && <Badge variant="secondary" className="text-[10px]">🤖 IA</Badge>}
                    <Badge variant="outline" className="text-[10px]">A4</Badge>
                  </div>
                </div>
                <h3 className="font-display font-bold">{game.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{game.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const showWordsField = selectedGameDef?.needsWords && (mode === "manual" || palavras.trim());

  const previewBody = gameData ? (
    <div className="flex flex-col items-center gap-6 w-full">
      {renderPreview()}
      {answerKey !== "none" && showAnswerKey && (
        <AnswerKeyPreview gameType={selectedGame!} gameData={gameData} config={getConfig()} />
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-card text-card-foreground shadow-lg a4-page-scaled min-h-[420px] w-full max-w-[210mm]">
      <Gamepad2 className="h-14 w-14 mb-4 opacity-20" />
      <p className="text-sm font-medium text-center px-6">
        {mode === "ai" ? 'Insira o tema e clique em "Gerar com IA"' : 'Configure e clique em "Gerar Jogo"'}
      </p>
      <p className="text-xs mt-1 opacity-60 text-center px-6">O preview A4 aparecerá aqui</p>
    </div>
  );

  return (
    <div className="space-y-4 overflow-x-hidden">
      <EditorTopBar
        title={`Criador de Jogos A4 · ${selectedGameDef?.title ?? "Jogo"}`}
        onPrint={gameData ? handlePrint : undefined}
        onPdf={gameData ? handlePDF : undefined}
        onSave={gameData ? handleSave : undefined}
        saving={saving}
        leading={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedGame(null);
              setGameData(null);
              setPalavras("");
              setMazeQuestions([]);
              setShowAnswerKey(false);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Jogos
          </Button>
        }
        actions={gameData ? [
          <Button key="regenerate" variant="outline" size="sm" onClick={() => { setGameData(null); setTimeout(handleGenerate, 100); }} className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3">
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Novo layout
          </Button>,
          ...(answerKey !== "none" ? [
            <Button key="answer-key" variant="outline" size="sm" onClick={() => setShowAnswerKey(!showAnswerKey)} className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> {showAnswerKey ? "Ocultar" : "Ver"} gabarito
            </Button>
          ] : []),
        ] : []}
      />

      <div className="grid gap-4 lg:grid-cols-[380px_1fr] overflow-hidden">
        <div className="space-y-4 pr-1">
          <Card className="shadow-card">
            <CardContent className="pt-4 space-y-3">
              <div className="rounded-lg border border-dashed border-primary/30 p-3 space-y-3 bg-primary/5">
                <Label className="text-xs font-semibold">🏫 Cabeçalho Institucional</Label>
                <TimbreSelector
                  selectedId={selectedTimbre?.id}
                  onSelect={handleTimbreSelect}
                  label="Selecionar escola/timbre"
                />
                {!selectedTimbre && (
                  <Input placeholder="Ou digite o nome da escola" value={header.escola} onChange={e => setHeader(h => ({ ...h, escola: e.target.value }))} className="h-8 text-xs" />
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Professor(a)</Label>
                    <Input placeholder="Nome do professor" value={header.professor} onChange={e => setHeader(h => ({ ...h, professor: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Turma</Label>
                    <Input placeholder="Ex: 5ºA, Turma 301" value={header.serie} onChange={e => setHeader(h => ({ ...h, serie: e.target.value }))} className="h-8 text-xs" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  {editorMode === "quick" ? <Zap className="h-3 w-3" /> : <Settings2 className="h-3 w-3" />}
                  Modo {editorMode === "quick" ? "Rápido" : "Avançado"}
                </Label>
                <Switch checked={isAdvanced} onCheckedChange={v => setEditorMode(v ? "advanced" : "quick")} />
              </div>

              <Section title="📚 Etapa Escolar">
                <div className="grid grid-cols-3 gap-1">
                  {(Object.entries(etapaConfig) as [EtapaEscolar, typeof etapaConfig.iniciais][]).map(([key, cfg]) => (
                    <button key={key} onClick={() => { setEtapa(key); applyEtapaDefaults(key, difficulty); }}
                      className={`rounded-md border p-2 text-center transition-all ${etapa === key ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/40"}`}>
                      <span className="text-base">{cfg.icon}</span>
                      <p className="text-[9px] font-medium mt-0.5 leading-tight">{cfg.label}</p>
                      <p className="text-[8px] text-muted-foreground">{cfg.desc}</p>
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="🎯 Nível de Dificuldade">
                <div className="grid grid-cols-3 gap-1">
                  {(["facil", "medio", "dificil"] as Difficulty[]).map(d => (
                    <button key={d} onClick={() => { setDifficulty(d); applyEtapaDefaults(etapa, d); }}
                      className={`rounded-md border p-2 text-center transition-all text-[10px] font-medium ${difficulty === d ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/40"}`}>
                      {d === "facil" ? "Fácil" : d === "medio" ? "Médio" : "Difícil"}
                    </button>
                  ))}
                </div>
              </Section>

              {selectedGameDef?.supportsAI && (
                <Section title="⚡ Modo de Geração">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={() => setMode("ai")} className={`flex items-center justify-center gap-1.5 rounded-md border p-2 text-[10px] font-medium transition-all ${mode === "ai" ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border hover:border-muted-foreground/40"}`}>
                      <Wand2 className="h-3 w-3" /> Gerar com IA
                    </button>
                    <button onClick={() => setMode("manual")} className={`flex items-center justify-center gap-1.5 rounded-md border p-2 text-[10px] font-medium transition-all ${mode === "manual" ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border hover:border-muted-foreground/40"}`}>
                      <Edit3 className="h-3 w-3" /> Manual
                    </button>
                  </div>
                </Section>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tema <Tip text="O tema será usado pela IA ou como título" /></Label>
                <Input placeholder="Ex: Adjetivos, Frações, Sistema Solar..." value={tema} onChange={e => setTema(e.target.value)} className="h-8 text-xs" />
                <p className="text-[9px] text-muted-foreground">
                  Português: <span className="font-medium">Substantivos, Verbos, Pontuação</span> ·
                  Matemática: <span className="font-medium">Frações, Geometria, Álgebra</span>
                </p>
              </div>

              {showWordsField && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Palavras-chave (vírgula)</Label>
                  <Textarea placeholder="SUJEITO, VERBO, PREDICADO ou FRAÇÃO, NUMERADOR, DENOMINADOR" value={palavras} onChange={e => setPalavras(e.target.value)} className="min-h-[50px] text-xs" />
                  <p className="text-[9px] text-muted-foreground">
                    Ex: SUBSTANTIVO, ADJETIVO, VERBO ou SOMA, SUBTRAÇÃO, MULTIPLICAÇÃO
                  </p>
                </div>
              )}

              {/* ===== GAME-SPECIFIC CONFIGS ===== */}
              {selectedGame === "caca-palavras" && (
                <>
                  <Section title="🔍 Configurações do Caça-Palavras">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Tamanho da Grade <Tip text="Grades maiores permitem mais palavras" /></Label>
                      <Select value={gridSize} onValueChange={v => setGridSize(v as GridSize)}>
                        <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="8x8">8×8</SelectItem>
                          <SelectItem value="10x10">10×10</SelectItem>
                          <SelectItem value="12x12">12×12</SelectItem>
                          <SelectItem value="15x15">15×15</SelectItem>
                          <SelectItem value="18x18">18×18</SelectItem>
                          <SelectItem value="20x20">20×20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px]">Direções permitidas <Tip text="Mais direções = mais difícil" /></Label>
                      <div className="space-y-1">
                        {[
                          { key: "horizontal" as const, label: "➡️ Horizontal" },
                          { key: "vertical" as const, label: "⬇️ Vertical" },
                          { key: "diagonalDown" as const, label: "↘️ Diagonal" },
                          { key: "diagonalUp" as const, label: "↗️ Diagonal reversa" },
                          { key: "reversed" as const, label: "🔄 Invertidas (trás p/ frente)" },
                        ].map(d => (
                          <div key={d.key} className="flex items-center gap-2">
                            <Checkbox
                              id={`dir-${d.key}`}
                              checked={directions[d.key]}
                              onCheckedChange={v => setDirections(prev => ({ ...prev, [d.key]: !!v }))}
                            />
                            <label htmlFor={`dir-${d.key}`} className="text-[10px]">{d.label}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px]">Lista de palavras <Tip text="Ocultar lista torna a atividade mais desafiadora" /></Label>
                      <Select value={wordListPosition} onValueChange={setWordListPosition}>
                        <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="below">Visível abaixo</SelectItem>
                          <SelectItem value="side">Visível ao lado</SelectItem>
                          <SelectItem value="above">Visível acima</SelectItem>
                          <SelectItem value="hidden">Ocultar lista</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-[10px]">📖 Gerar minitexto com palavras <Tip text="Gera um pequeno texto com as palavras em CAIXA ALTA para o aluno encontrar" /></Label>
                      <Switch checked={miniText} onCheckedChange={setMiniText} />
                    </div>
                  </Section>

                  {isAdvanced && (
                    <Section title="⚙️ Configurações Avançadas" defaultOpen={false}>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Tipo de letra</Label>
                        <Select value={letterCase} onValueChange={setLetterCase}>
                          <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upper">MAIÚSCULAS</SelectItem>
                            <SelectItem value="lower">minúsculas</SelectItem>
                            <SelectItem value="capitalize">Primeira maiúscula</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Formato das células</Label>
                        <Select value={cellFormat} onValueChange={setCellFormat}>
                          <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="square">Quadrado</SelectItem>
                            <SelectItem value="circle">Círculo</SelectItem>
                            <SelectItem value="none">Sem fundo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Ordenação da lista</Label>
                        <Select value={wordListOrder} onValueChange={setWordListOrder}>
                          <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alphabetical">Alfabética</SelectItem>
                            <SelectItem value="shuffled">Embaralhada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Espaçamento ({spacing.toFixed(1)}x)</Label>
                        <Slider value={[spacing]} onValueChange={v => setSpacing(v[0])} min={0.8} max={1.5} step={0.1} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Instruções personalizadas</Label>
                        <Textarea placeholder="Escreva instruções para os alunos..." value={customInstructions} onChange={e => setCustomInstructions(e.target.value)} className="min-h-[40px] text-[10px]" />
                      </div>
                    </Section>
                  )}
                </>
              )}

              {selectedGame === "cruzadinha" && (
                <>
                  <Section title="✏️ Configurações das Cruzadas">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Estilo de Dica <Tip text="Define como as dicas são apresentadas" /></Label>
                      <Select value={hintStyle} onValueChange={setHintStyle}>
                        <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto descritivo</SelectItem>
                          <SelectItem value="synonym">Sinônimo</SelectItem>
                          <SelectItem value="fill-blank">Preencha a lacuna</SelectItem>
                          <SelectItem value="question">Pergunta</SelectItem>
                          <SelectItem value="riddle">Enigma/Charada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {isAdvanced && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Simetria da grade</Label>
                          <Select value={crosswordSymmetry} onValueChange={setCrosswordSymmetry}>
                            <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="symmetric">Simétrica</SelectItem>
                              <SelectItem value="asymmetric">Assimétrica</SelectItem>
                              <SelectItem value="radial">Radial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Palavra misteriosa (opcional)</Label>
                          <Input placeholder="Palavra que aparece na vertical" value={mysteryWord} onChange={e => setMysteryWord(e.target.value)} className="h-7 text-[10px]" />
                        </div>
                      </>
                    )}
                  </Section>
                </>
              )}

              {selectedGame === "criptograma" && (
                <>
                  <Section title="🔐 Configurações do Criptograma">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Tipo de cifra <Tip text="Tipo de codificação usada" /></Label>
                      <Select value={cipherType} onValueChange={v => setCipherType(v as CryptoCipherType)}>
                        <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="numeric">Numérica (A=1)</SelectItem>
                          <SelectItem value="substitution">Substituição aleatória</SelectItem>
                          <SelectItem value="caesar">Cifra de César</SelectItem>
                          <SelectItem value="math">Equações matemáticas</SelectItem>
                          <SelectItem value="vigenere">Polialfabética (Vigenère)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {cipherType === "caesar" && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Deslocamento César ({caesarShift})</Label>
                        <Slider value={[caesarShift]} onValueChange={v => setCaesarShift(v[0])} min={1} max={25} step={1} />
                      </div>
                    )}

                    {cipherType === "vigenere" && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Palavra-chave Vigenère</Label>
                        <Input placeholder="CHAVE" value={vigenereKey} onChange={e => setVigenereKey(e.target.value)} className="h-7 text-[10px]" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label className="text-[10px]">Tema dos símbolos</Label>
                      <Select value={symbolTheme} onValueChange={v => setSymbolTheme(v as CryptoSymbolTheme)}>
                        <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="random">Números (1-26)</SelectItem>
                          <SelectItem value="math">Matemático (∑, ∆, π)</SelectItem>
                          <SelectItem value="emoji">Emojis (★, ♥, ♦)</SelectItem>
                          <SelectItem value="tech">Tecnologia (⌘, #, @)</SelectItem>
                          <SelectItem value="geometric">Geométrico (▲, ●, ■)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {mode === "manual" && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Frase Secreta</Label>
                        <Textarea placeholder="A TECNOLOGIA TRANSFORMA O MUNDO" value={tema} onChange={e => setTema(e.target.value)} className="min-h-[40px] text-[10px]" />
                      </div>
                    )}
                  </Section>

                  {isAdvanced && (
                    <Section title="⚙️ Configurações Avançadas" defaultOpen={false}>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Exibição da tabela</Label>
                        <Select value={showCipherTable} onValueChange={setShowCipherTable}>
                          <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Completa</SelectItem>
                            <SelectItem value="partial">Parcial (dedução)</SelectItem>
                            <SelectItem value="hidden">Ocultar (avançado)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </Section>
                  )}
                </>
              )}

              {selectedGame === "sudoku" && (
                <>
                  <Section title="🧩 Configurações do Sudoku">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Tamanho da grade <Tip text="Grades menores são mais fáceis" /></Label>
                      <Select value={String(sudokuSize)} onValueChange={v => setSudokuSize(Number(v) as 4 | 6 | 8 | 9)}>
                        <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4×4</SelectItem>
                          <SelectItem value="6">6×6</SelectItem>
                          <SelectItem value="9">9×9</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Tipo de conteúdo</Label>
                      <Select value={sudokuContentType} onValueChange={setSudokuContentType}>
                        <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="numbers">Números</SelectItem>
                          <SelectItem value="shapes">Formas Geométricas</SelectItem>
                          <SelectItem value="letters">Letras (A-I)</SelectItem>
                          <SelectItem value="emojis">Emojis</SelectItem>
                          <SelectItem value="words">Palavras Curtas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {sudokuContentType === "words" && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Símbolos ({sudokuSize} separados por vírgula)</Label>
                        <Input placeholder="HTML, CSS, JS, SQL" value={sudokuCustomSymbols} onChange={e => setSudokuCustomSymbols(e.target.value)} className="h-7 text-[10px]" />
                      </div>
                    )}
                  </Section>

                  {isAdvanced && (
                    <Section title="⚙️ Configurações Avançadas" defaultOpen={false}>
                      <div className="space-y-1">
                        <Label className="text-[10px]">% preenchido ({sudokuFillPercent}%)</Label>
                        <Slider value={[sudokuFillPercent]} onValueChange={v => setSudokuFillPercent(v[0])} min={20} max={80} step={5} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Puzzles por página ({sudokuCount})</Label>
                        <Slider value={[sudokuCount]} onValueChange={v => setSudokuCount(v[0])} min={1} max={4} step={1} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px]">Espaço para rascunho</Label>
                        <Switch checked={sudokuShowScratch} onCheckedChange={setSudokuShowScratch} />
                      </div>
                    </Section>
                  )}
                </>
              )}

              {selectedGame === "labirinto" && (
                <Section title="🏁 Configurações do Labirinto">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Tamanho <Tip text="Tamanho visual do labirinto na página" /></Label>
                    <Select value={mazeSize} onValueChange={setMazeSize}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequeno (¼ página)</SelectItem>
                        <SelectItem value="medium">Médio (½ página)</SelectItem>
                        <SelectItem value="large">Grande (página inteira)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Section>
              )}

              <Section title="📋 Gabarito">
                <div className="space-y-1">
                  <Label className="text-[10px]">Gabarito do Professor</Label>
                  <Select value={answerKey} onValueChange={v => setAnswerKey(v as AnswerKeyMode)}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="separate">Folha separada</SelectItem>
                      <SelectItem value="none">Não incluir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Section>

              <div className="flex flex-col gap-2 pt-2 border-t">
                <Button onClick={handleGenerate} disabled={generating} className="gradient-primary border-0 text-primary-foreground hover:opacity-90 h-9 text-xs">
                  {generating ? (
                    <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Gerando...</>
                  ) : mode === "ai" && selectedGameDef?.supportsAI ? (
                    <><Wand2 className="mr-1 h-3 w-3" /> Gerar com IA</>
                  ) : (
                    <><Sparkles className="mr-1 h-3 w-3" /> Gerar Jogo</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-hidden min-w-0">
          <div ref={undefined} data-a4-container data-preview-mode={previewMode} className="bg-muted/30 rounded-lg p-2 sm:p-4 flex flex-col items-center gap-4 w-full overflow-x-hidden max-w-full">
            <div className="flex items-center gap-1 rounded-lg border bg-card p-0.5 self-end">
              <button
                onClick={() => setPreviewMode("print")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-all ${previewMode === "print" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Monitor className="h-3 w-3" /> Impressão
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-all ${previewMode === "mobile" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Smartphone className="h-3 w-3" /> Leitura
              </button>
            </div>

            <style>{`
              [data-a4-container] .a4-page-scaled {
                word-wrap: break-word;
                overflow-wrap: break-word;
                hyphens: auto;
              }
              [data-a4-container] .a4-page-scaled img,
              [data-a4-container] .a4-page-scaled table {
                max-width: 100% !important;
                height: auto !important;
              }
              [data-preview-mode="mobile"] .a4-page-scaled {
                width: 100% !important;
                max-width: 100% !important;
                min-height: unset !important;
                max-height: none !important;
                height: auto !important;
                padding: 4mm !important;
                box-shadow: none !important;
              }
              [data-preview-mode="mobile"] .responsive-a4-inner {
                width: 100% !important;
                transform: none !important;
                margin: 0 auto !important;
              }
              [data-preview-mode="mobile"] #game-print-area,
              [data-preview-mode="mobile"] #answer-key-area {
                width: 100% !important;
                max-width: 100% !important;
              }
            `}</style>

            {previewMode === "print" ? (
              <ResponsiveA4Wrapper>{previewBody}</ResponsiveA4Wrapper>
            ) : (
              <div className="w-full max-w-full">{previewBody}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
