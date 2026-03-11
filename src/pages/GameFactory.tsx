import { useState, useCallback, useEffect } from "react";
import ResponsiveA4Wrapper from "@/components/ResponsiveA4Wrapper";
import {
  Gamepad2, Search as SearchIcon, Grid3X3, Lock, MapPin,
  Sparkles, Loader2, Printer, RotateCcw, FileDown, ArrowLeft,
  Wand2, Edit3, Save, FileText, Palette, EyeOff, Zap, Settings2,
  HelpCircle, ChevronDown, ChevronUp, Eye,
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
  { id: "labirinto", title: "Labirinto com Desafios", icon: MapPin, desc: "Encontre o caminho resolvendo perguntas", needsWords: false, supportsAI: true },
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

  // Always sync header with branding from Timbres e Branding
  useEffect(() => {
    setHeader(h => ({
      ...h,
      logoUrl: timbre.logoUrl || h.logoUrl,
      bannerUrl: timbre.bannerUrl || h.bannerUrl,
    }));
  }, [timbre]);

  // Apply etapa defaults when etapa/difficulty changes for word search
  const applyEtapaDefaults = (e: EtapaEscolar, d: Difficulty) => {
    const defs = getWordSearchDefaults(e, d);
    setGridSize(defs.gridSize);
    setDirections(defs.directions);
  };

  const getConfig = useCallback((): GameConfig => ({
    tema, palavras, difficulty, etapa, header, colorMode, answerKey,
    customInstructions: customInstructions || undefined,
    gridSize, directions, wordListPosition: wordListPosition as any,
    wordListOrder: wordListOrder as any, cellFormat: cellFormat as any,
    letterCase: letterCase as any, fontStyle: fontStyle as any,
    spacing, bonusWords: bonusWords || undefined, miniText,
    hideWordList: wordListPosition === "hidden",
    hintStyle: hintStyle as any, crosswordSymmetry: crosswordSymmetry as any,
    mysteryWord: mysteryWord || undefined,
    symbolTheme, cipherType, caesarShift, vigenereKey: vigenereKey || undefined,
    showCipherTable: showCipherTable as any, phraseLength: phraseLength as any,
    sudokuSize, sudokuContentType: sudokuContentType as any,
    sudokuCustomSymbols: sudokuCustomSymbols ? sudokuCustomSymbols.split(",").map(s => s.trim()).filter(Boolean) : undefined,
    sudokuFillPercent, sudokuCount, sudokuShowScratch,
    mazeQuestions: mazeQuestions.length > 0 ? mazeQuestions : undefined,
    mazeSize: mazeSize as any, mazeQuestionType: mazeQuestionType as any,
    mazeStyle: "square",
  }), [tema, palavras, difficulty, etapa, header, colorMode, answerKey, customInstructions,
    gridSize, directions, wordListPosition, wordListOrder, cellFormat, letterCase, fontStyle, spacing, bonusWords, miniText,
    hintStyle, crosswordSymmetry, mysteryWord,
    symbolTheme, cipherType, caesarShift, vigenereKey, showCipherTable, phraseLength,
    sudokuSize, sudokuContentType, sudokuCustomSymbols, sudokuFillPercent, sudokuCount, sudokuShowScratch,
    mazeQuestions, mazeSize, mazeQuestionType]);

  const generators: Record<string, (c: GameConfig) => any> = {
    "caca-palavras": generateWordSearch,
    "cruzadinha": generateCrossword,
    "criptograma": generateCryptogram,
    "sudoku": generateSudoku,
    "labirinto": generateMaze,
  };

  const handleGenerateManual = () => {
    if (!tema.trim() && selectedGame !== "sudoku") { toast.error("Insira o tema"); return; }
    if (selectedGameDef?.needsWords && !palavras.trim()) { toast.error("Insira as palavras-chave separadas por vírgula"); return; }
    setGenerating(true);
    setTimeout(() => {
      try {
        const gen = generators[selectedGame!];
        if (gen) { setGameData(gen(getConfig())); toast.success("Jogo gerado!"); }
      } catch { toast.error("Erro ao gerar"); }
      finally { setGenerating(false); }
    }, 200);
  };

  const { canUseAI, deductCredit } = useCredits();

  const handleGenerateAI = async () => {
    if (!tema.trim()) { toast.error("Insira o tema"); return; }
    if (!canUseAI) { toast.error("Limite atingido. Faça o upgrade para continuar criando."); return; }
    setGenerating(true);
    try {
      const ok = await deductCredit();
      if (!ok) { toast.error("Sem créditos disponíveis."); setGenerating(false); return; }
      const wsDefaults = getWordSearchDefaults(etapa, difficulty);
      const { data: aiData, error } = await supabase.functions.invoke("generate-game", {
        body: { gameType: selectedGame, tema, difficulty, etapa, count: wsDefaults.wordCount },
      });
      if (error) throw error;
      if (aiData?.error) { toast.error(aiData.error); setGenerating(false); return; }

      const config = getConfig();
      if (selectedGame === "caca-palavras" && aiData.palavras) {
        const enriched = { ...config, palavras: aiData.palavras.join(", ") };
        setPalavras(enriched.palavras);
        setGameData(generateWordSearch(enriched));
      } else if (selectedGame === "cruzadinha" && aiData.palavras) {
        const enriched: GameConfig = { ...config, palavras: aiData.palavras.join(", "), _aiHints: aiData.dicas };
        setPalavras(enriched.palavras);
        setGameData(generateCrossword(enriched));
      } else if (selectedGame === "criptograma" && aiData.mensagem) {
        setGameData(generateCryptogram({ ...config, _aiCryptogramMessage: aiData.mensagem }));
      } else if (selectedGame === "labirinto" && aiData.questions) {
        setMazeQuestions(aiData.questions);
        setGameData(generateMaze({ ...config, mazeQuestions: aiData.questions }));
      } else {
        const gen = generators[selectedGame!];
        if (gen) setGameData(gen(config));
      }
      toast.success("🤖 Jogo gerado com IA!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar com IA");
    } finally { setGenerating(false); }
  };

  const handleGenerate = () => {
    if (mode === "ai" && selectedGameDef?.supportsAI) handleGenerateAI();
    else handleGenerateManual();
  };

  const handlePrint = () => {
    const el = document.getElementById("game-print-area");
    const ak = document.getElementById("answer-key-area");
    if (!el) return;
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`<html><head><title>${tema || "Jogo"}</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      @page { size: A4; margin: 15mm; }
      body { font-family: 'Inter', 'Arial', sans-serif; }
    </style></head><body>`);
    pw.document.write(el.innerHTML);
    if (ak && answerKey !== "none") pw.document.write(ak.innerHTML);
    pw.document.write("</body></html>");
    pw.document.close();
    pw.focus();
    pw.print();
    pw.close();
  };

  const handlePDF = async () => {
    const el = document.getElementById("game-print-area");
    if (!el) return;
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const container = document.createElement("div");

      // Clone game page
      const gameClone = el.cloneNode(true) as HTMLElement;
      gameClone.style.width = "210mm";
      gameClone.style.minHeight = "297mm";
      gameClone.style.maxHeight = "297mm";
      gameClone.style.padding = "20mm 15mm";
      gameClone.style.boxSizing = "border-box";
      gameClone.style.overflow = "hidden";
      gameClone.style.background = "#fff";
      gameClone.style.position = "relative";
      container.appendChild(gameClone);

      // Clone answer key if enabled
      if (answerKey !== "none") {
        const ak = document.getElementById("answer-key-area");
        if (ak) {
          const akClone = ak.cloneNode(true) as HTMLElement;
          akClone.style.width = "210mm";
          akClone.style.minHeight = "297mm";
          akClone.style.padding = "20mm 15mm";
          akClone.style.boxSizing = "border-box";
          akClone.style.pageBreakBefore = "always";
          akClone.style.background = "#fff";
          container.appendChild(akClone);
        }
      }

      // Force all table cells and grid cells to have centered text
      container.querySelectorAll("td, div").forEach((node) => {
        const el = node as HTMLElement;
        if (el.style.textAlign === "center" || el.style.display === "flex") {
          el.style.textAlign = "center";
          el.style.verticalAlign = "middle";
        }
      });

      await html2pdf().set({
        margin: 0,
        filename: `${tema || "jogo"}-${selectedGame}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          width: 794,  // 210mm at 96dpi
          windowWidth: 794,
          letterRendering: true,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], avoid: ["table", "svg", ".no-break"] },
      }).from(container).save();
      toast.success("PDF exportado!");
    } catch { toast.error("Erro ao exportar PDF"); }
  };

  const handleSave = async () => {
    if (!user) { toast.error("Faça login para salvar"); return; }
    if (!gameData) return;
    if (!docLimits.checkAndWarnLimit()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("documentos_salvos").insert({
        user_id: user.id, tipo: "jogo",
        titulo: `${selectedGameDef?.title}: ${tema || "Sem tema"}`,
        conteudo: { gameType: selectedGame, gameData, config: getConfig() } as any,
        disciplina: header.disciplina || null, nivel: difficulty,
      });
      if (error) throw error;
      toast.success("Salvo!");
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  };

  const renderPreview = () => {
    if (!gameData || !selectedGame) return null;
    const config = getConfig();
    const previews: Record<string, React.ReactNode> = {
      "caca-palavras": <WordSearchPreview data={gameData} config={config} />,
      "cruzadinha": <CrosswordPreview data={gameData} config={config} />,
      "criptograma": <CryptogramPreview data={gameData} config={config} />,
      "sudoku": <SudokuPreview data={gameData} config={config} />,
      "labirinto": <MazePreview data={gameData} config={config} />,
    };
    return previews[selectedGame] || null;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setHeader(h => ({ ...h, logoUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const addMazeQuestion = () => {
    if (mazeQuestions.length >= 5) { toast.error("Máximo 5 perguntas"); return; }
    setMazeQuestions(q => [...q, { question: "", alternatives: ["", "", "", ""], correctIndex: 0 }]);
  };
  const updateMazeQuestion = (idx: number, field: string, value: any) => {
    setMazeQuestions(qs => qs.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };
  const updateMazeAlternative = (qi: number, ai: number, value: string) => {
    setMazeQuestions(qs => qs.map((q, i) => i === qi ? { ...q, alternatives: q.alternatives.map((a, j) => j === ai ? value : a) } : q));
  };
  const removeMazeQuestion = (idx: number) => {
    setMazeQuestions(qs => qs.filter((_, i) => i !== idx));
  };

  // --- GAME SELECTOR ---
  if (!selectedGame) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-primary" /> Gerador de Atividades Pedagógicas
          </h1>
          <p className="text-muted-foreground mt-1">5 jogos educacionais personalizáveis para impressão A4</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map(game => (
            <Card
              key={game.id}
              className="shadow-card cursor-pointer transition-all hover:shadow-elevated hover:scale-[1.02]"
              onClick={() => { setSelectedGame(game.id); setGameData(null); setMode(game.supportsAI ? "ai" : "manual"); applyEtapaDefaults(etapa, difficulty); }}
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

  // --- SPLIT EDITOR ---
  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedGame(null); setGameData(null); setPalavras(""); setMazeQuestions([]); }}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Jogos
          </Button>
          <h1 className="font-display text-lg font-bold flex items-center gap-2">
            {selectedGameDef && <selectedGameDef.icon className="h-5 w-5 text-primary" />}
            {selectedGameDef?.title}
          </h1>
        </div>
        {gameData && (
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-7 text-[10px]">
              <Printer className="h-3 w-3 mr-1" /> Imprimir
            </Button>
            <Button variant="outline" size="sm" onClick={handlePDF} className="h-7 text-[10px]">
              <FileDown className="h-3 w-3 mr-1" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="h-7 text-[10px]">
              <Save className="h-3 w-3 mr-1" /> {saving ? "..." : "Salvar"}
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-4 items-start" style={{ minHeight: "calc(100vh - 180px)" }}>
        {/* LEFT PANEL */}
        <div className="w-[340px] shrink-0 sticky top-4 space-y-2.5 overflow-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
          <Card className="shadow-card">
            <CardContent className="p-3 space-y-3">

              {/* Timbre / Branding - at the top */}
              <Section title="🏫 Timbre da Escola" defaultOpen={header.showHeader}>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-[10px]">Incluir timbre no documento</Label>
                  <Switch checked={header.showHeader} onCheckedChange={v => setHeader(h => ({ ...h, showHeader: v }))} />
                </div>
                {header.showHeader && (
                  <div className="space-y-1.5">
                    {(timbre.escola || timbre.logoUrl) && (
                      <div className="rounded border border-primary/20 bg-primary/5 p-1.5 text-[9px] text-primary flex items-center gap-1.5">
                        {timbre.logoUrl && <img src={timbre.logoUrl} alt="Logo" className="h-5 object-contain" crossOrigin="anonymous" />}
                        <span>Timbre carregado: <strong>{timbre.escola || "Logo"}</strong></span>
                      </div>
                    )}
                    {!timbre.logoUrl && (
                      <div>
                        <Label className="text-[9px]">Logo (opcional)</Label>
                        <Input type="file" accept="image/*" onChange={handleLogoUpload} className="h-7 text-[9px]" />
                        {header.logoUrl && <img src={header.logoUrl} alt="Logo" className="h-7 mt-1 object-contain" />}
                      </div>
                    )}
                    <Input placeholder="Escola" value={header.escola} onChange={e => setHeader(h => ({ ...h, escola: e.target.value }))} className="h-7 text-[9px]" />
                    <div className="grid grid-cols-2 gap-1">
                      <Input placeholder="Professor(a)" value={header.professor} onChange={e => setHeader(h => ({ ...h, professor: e.target.value }))} className="h-7 text-[9px]" />
                      <Input placeholder="Disciplina" value={header.disciplina} onChange={e => setHeader(h => ({ ...h, disciplina: e.target.value }))} className="h-7 text-[9px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <Input placeholder="Série/Turma" value={header.serie} onChange={e => setHeader(h => ({ ...h, serie: e.target.value }))} className="h-7 text-[9px]" />
                      <Input placeholder="Data" value={header.data} onChange={e => setHeader(h => ({ ...h, data: e.target.value }))} className="h-7 text-[9px]" />
                    </div>
                  </div>
                )}
              </Section>

              {/* Quick/Advanced toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  {editorMode === "quick" ? <Zap className="h-3 w-3" /> : <Settings2 className="h-3 w-3" />}
                  Modo {editorMode === "quick" ? "Rápido" : "Avançado"}
                </Label>
                <Switch checked={isAdvanced} onCheckedChange={v => setEditorMode(v ? "advanced" : "quick")} />
              </div>

              {/* Etapa Escolar */}
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

              {/* Difficulty */}
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

              {/* Mode toggle */}
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

              {/* Tema */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tema <Tip text="O tema será usado pela IA ou como título" /></Label>
                <Input placeholder="Ex: Adjetivos, Frações, Sistema Solar..." value={tema} onChange={e => setTema(e.target.value)} className="h-8 text-xs" />
                <p className="text-[9px] text-muted-foreground">
                  Português: <span className="font-medium">Substantivos, Verbos, Pontuação</span> · 
                  Matemática: <span className="font-medium">Frações, Geometria, Álgebra</span>
                </p>
              </div>

              {/* Words */}
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

              {/* CAÇA-PALAVRAS */}
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

              {/* CRUZADINHA */}
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
                  </Section>

                  {isAdvanced && (
                    <Section title="⚙️ Configurações Avançadas" defaultOpen={false}>
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
                    </Section>
                  )}
                </>
              )}

              {/* CRIPTOGRAMA */}
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

              {/* SUDOKU */}
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

              {/* LABIRINTO */}
              {selectedGame === "labirinto" && (
                <>
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

                    {mode === "manual" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px]">🔒 Incluir perguntas nos checkpoints <Tip text="Opcional — adicione perguntas que bloqueiam o caminho" /></Label>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-semibold">Perguntas ({mazeQuestions.length}/5)</Label>
                          <Button variant="outline" size="sm" onClick={addMazeQuestion} className="h-5 text-[9px] px-2">+ Pergunta</Button>
                        </div>
                        {mazeQuestions.length === 0 && (
                          <p className="text-[9px] text-muted-foreground italic">Nenhuma pergunta adicionada. O labirinto será gerado apenas com o caminho.</p>
                        )}
                        {mazeQuestions.map((q, qi) => (
                          <div key={qi} className="space-y-1 border rounded p-2 bg-muted/30">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold">Checkpoint {String.fromCharCode(65 + qi)}</span>
                              <button onClick={() => removeMazeQuestion(qi)} className="text-destructive text-[9px]">✕</button>
                            </div>
                            <Input placeholder="Pergunta..." value={q.question} onChange={e => updateMazeQuestion(qi, "question", e.target.value)} className="h-6 text-[9px]" />
                            {q.alternatives.map((alt, ai) => (
                              <div key={ai} className="flex gap-1 items-center">
                                <button onClick={() => updateMazeQuestion(qi, "correctIndex", ai)}
                                  className={`w-4 h-4 rounded-full border text-[7px] flex items-center justify-center shrink-0 ${q.correctIndex === ai ? "bg-primary text-primary-foreground" : "border-border"}`}>
                                  {String.fromCharCode(65 + ai)}
                                </button>
                                <Input placeholder={`Alt. ${String.fromCharCode(65 + ai)}`} value={alt} onChange={e => updateMazeAlternative(qi, ai, e.target.value)} className="h-5 text-[9px] flex-1" />
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>
                </>
              )}

              {/* Color Mode */}
              <Section title="🎨 Aparência">
                <div className="space-y-1">
                  <Label className="text-[10px]">Modo de Cor</Label>
                  <div className="flex gap-1">
                    {([["color", "Colorido"], ["grayscale", "P&B"], ["high-contrast", "Alto Contraste"]] as const).map(([key, label]) => (
                      <button key={key} onClick={() => setColorMode(key)}
                        className={`px-2 py-1 rounded text-[9px] border flex-1 ${colorMode === key ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

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

              {/* Generate */}
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
                {gameData && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => { setGameData(null); setTimeout(handleGenerate, 100); }} className="h-7 text-[10px]">
                      <RotateCcw className="h-3 w-3 mr-1" /> Novo Layout
                    </Button>
                    {answerKey !== "none" && (
                      <Button variant="outline" size="sm" onClick={() => setShowAnswerKey(!showAnswerKey)} className="h-7 text-[10px]">
                        <Eye className="h-3 w-3 mr-1" /> {showAnswerKey ? "Ocultar" : "Ver"} Gabarito
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Preview */}
        <div className="flex-1 min-w-0">
          <div className="bg-muted/30 rounded-lg p-4 flex flex-col items-center gap-6 overflow-auto">
            {gameData ? (
              <>
                <div className="shadow-elevated">{renderPreview()}</div>
                {answerKey !== "none" && showAnswerKey && (
                  <div className="shadow-elevated">
                    <AnswerKeyPreview gameType={selectedGame!} gameData={gameData} config={getConfig()} />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Gamepad2 className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">
                  {mode === "ai" ? "Insira o tema e clique em \"Gerar com IA\"" : "Configure e clique em \"Gerar Jogo\""}
                </p>
                <p className="text-xs mt-1">O preview A4 aparecerá aqui</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
