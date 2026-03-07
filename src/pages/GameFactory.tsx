import { useState, useCallback } from "react";
import {
  Gamepad2, Search as SearchIcon, Grid3X3, Lock, MapPin,
  Sparkles, Loader2, Printer, RotateCcw, FileDown, ArrowLeft,
  Wand2, Edit3, Save, FileText, Palette, EyeOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  difficultyConfig, defaultHeader,
  type Difficulty, type GameConfig, type GameHeader, type ColorMode,
  type GridSize, type CryptoSymbolTheme,
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

const GAMES = [
  { id: "caca-palavras", title: "Caça-Palavras", icon: SearchIcon, desc: "Grade com palavras escondidas em múltiplas direções", needsWords: true, supportsAI: true },
  { id: "cruzadinha", title: "Palavras Cruzadas", icon: Grid3X3, desc: "Grade com dicas horizontais e verticais", needsWords: true, supportsAI: true },
  { id: "criptograma", title: "Criptograma Lógico", icon: Lock, desc: "Decifre a mensagem com tabela de códigos", needsWords: false, supportsAI: true },
  { id: "sudoku", title: "Sudoku Temático", icon: Grid3X3, desc: "Puzzles 4×4, 6×6 ou 9×9 com números ou símbolos", needsWords: false, supportsAI: false },
  { id: "labirinto", title: "Labirinto com Desafios", icon: MapPin, desc: "Encontre o caminho resolvendo perguntas", needsWords: false, supportsAI: true },
];

export default function GameFactory() {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [tema, setTema] = useState("");
  const [palavras, setPalavras] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("facil");
  const [header, setHeader] = useState<GameHeader>({ ...defaultHeader });
  const [colorMode, setColorMode] = useState<ColorMode>("color");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gameData, setGameData] = useState<any>(null);
  const [mode, setMode] = useState<"ai" | "manual">("ai");

  // Game-specific options
  const [gridSize, setGridSize] = useState<GridSize>("10x10");
  const [hideWordList, setHideWordList] = useState(false);
  const [hintStyle, setHintStyle] = useState<"text" | "synonym" | "fill-blank">("text");
  const [symbolTheme, setSymbolTheme] = useState<CryptoSymbolTheme>("random");
  const [sudokuSize, setSudokuSize] = useState<4 | 6 | 9>(4);
  const [sudokuContentType, setSudokuContentType] = useState<"numbers" | "shapes" | "words">("numbers");
  const [sudokuCustomSymbols, setSudokuCustomSymbols] = useState("");
  const [mazeQuestions, setMazeQuestions] = useState<{ question: string; alternatives: string[]; correctIndex: number }[]>([]);

  const selectedGameDef = GAMES.find(g => g.id === selectedGame);

  const getConfig = useCallback((): GameConfig => ({
    tema, palavras, difficulty, header, colorMode,
    gridSize, hideWordList, hintStyle, symbolTheme,
    sudokuSize, sudokuContentType,
    sudokuCustomSymbols: sudokuCustomSymbols ? sudokuCustomSymbols.split(",").map(s => s.trim()).filter(Boolean) : undefined,
    mazeQuestions: mazeQuestions.length > 0 ? mazeQuestions : undefined,
  }), [tema, palavras, difficulty, header, colorMode, gridSize, hideWordList, hintStyle, symbolTheme, sudokuSize, sudokuContentType, sudokuCustomSymbols, mazeQuestions]);

  const generators: Record<string, (c: GameConfig) => any> = {
    "caca-palavras": generateWordSearch,
    "cruzadinha": generateCrossword,
    "criptograma": generateCryptogram,
    "sudoku": generateSudoku,
    "labirinto": generateMaze,
  };

  const handleGenerateManual = () => {
    if (!tema.trim() && selectedGame !== "sudoku") {
      toast.error("Insira o tema"); return;
    }
    if (selectedGameDef?.needsWords && !palavras.trim()) {
      toast.error("Insira as palavras-chave separadas por vírgula"); return;
    }
    setGenerating(true);
    setTimeout(() => {
      try {
        const config = getConfig();
        const gen = generators[selectedGame!];
        if (gen) {
          setGameData(gen(config));
          toast.success("Jogo gerado com sucesso!");
        }
      } catch {
        toast.error("Erro ao gerar o jogo");
      } finally {
        setGenerating(false);
      }
    }, 200);
  };

  const handleGenerateAI = async () => {
    if (!tema.trim()) { toast.error("Insira o tema para gerar com IA"); return; }
    setGenerating(true);
    try {
      const dc = difficultyConfig[difficulty];
      const { data: aiData, error } = await supabase.functions.invoke("generate-game", {
        body: { gameType: selectedGame, tema, difficulty, count: dc.wordCount },
      });
      if (error) throw error;
      if (aiData?.error) { toast.error(aiData.error); setGenerating(false); return; }

      const config = getConfig();

      if (selectedGame === "caca-palavras" && aiData.palavras) {
        const enriched = { ...config, palavras: aiData.palavras.join(", ") };
        setPalavras(enriched.palavras);
        setGameData(generateWordSearch(enriched));
      } else if (selectedGame === "cruzadinha" && aiData.palavras) {
        const enriched: GameConfig = {
          ...config,
          palavras: aiData.palavras.join(", "),
          _aiHints: aiData.dicas,
        };
        setPalavras(enriched.palavras);
        setGameData(generateCrossword(enriched));
      } else if (selectedGame === "criptograma" && aiData.mensagem) {
        const enriched: GameConfig = { ...config, _aiCryptogramMessage: aiData.mensagem };
        setGameData(generateCryptogram(enriched));
      } else if (selectedGame === "labirinto" && aiData.questions) {
        const enriched: GameConfig = { ...config, mazeQuestions: aiData.questions };
        setMazeQuestions(aiData.questions);
        setGameData(generateMaze(enriched));
      } else {
        const gen = generators[selectedGame!];
        if (gen) setGameData(gen(config));
      }
      toast.success("🤖 Jogo gerado com IA!");
    } catch (e: any) {
      console.error("AI generation error:", e);
      toast.error("Erro ao gerar com IA. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (mode === "ai" && selectedGameDef?.supportsAI) handleGenerateAI();
    else handleGenerateManual();
  };

  const handlePrint = () => {
    const el = document.getElementById("game-print-area");
    if (!el) return;
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`<html><head><title>${tema || "Jogo"}</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      @page { size: A4; margin: 10mm; }
      body { font-family: 'Inter', 'Arial', sans-serif; }
    </style></head><body>`);
    pw.document.write(el.innerHTML);
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
      html2pdf().set({
        margin: 0,
        filename: `${tema || "jogo"}-${selectedGame}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }).from(el).save();
      toast.success("PDF exportado!");
    } catch { toast.error("Erro ao exportar PDF"); }
  };

  const handleDOCX = async () => {
    try {
      const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = await import("docx");
      const { saveAs } = await import("file-saver");
      const children: any[] = [];

      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: `${selectedGameDef?.title}: ${tema}`, bold: true, size: 28, font: "Arial" })],
        spacing: { after: 300 },
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: `Nível: ${difficultyConfig[difficulty].label}`, size: 22, font: "Arial" })],
        spacing: { after: 200 },
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: "⚠️ Este jogo contém grades visuais. Para melhor resultado, exporte em PDF.", size: 20, font: "Arial", italics: true })],
        spacing: { after: 200 },
      }));

      if (selectedGame === "cruzadinha" && gameData?.clues) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Dicas Horizontais:", bold: true, size: 24, font: "Arial" })] }));
        gameData.clues.filter((c: any) => c.direction === "across").forEach((c: any) => {
          children.push(new Paragraph({ children: [new TextRun({ text: `${c.number}. ${c.hint}`, size: 22, font: "Arial" })], spacing: { after: 100 } }));
        });
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Dicas Verticais:", bold: true, size: 24, font: "Arial" })] }));
        gameData.clues.filter((c: any) => c.direction === "down").forEach((c: any) => {
          children.push(new Paragraph({ children: [new TextRun({ text: `${c.number}. ${c.hint}`, size: 22, font: "Arial" })], spacing: { after: 100 } }));
        });
      }

      if (selectedGame === "caca-palavras" && gameData?.placedWords) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Palavras para encontrar:", bold: true, size: 24, font: "Arial" })] }));
        gameData.placedWords.forEach((w: string) => {
          children.push(new Paragraph({ children: [new TextRun({ text: `• ${w}`, size: 22, font: "Arial" })], spacing: { after: 50 } }));
        });
      }

      const doc = new Document({
        sections: [{ properties: { page: { margin: { top: 567, bottom: 567, left: 567, right: 567 } } }, children }],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${tema || "jogo"}-${selectedGame}.docx`);
      toast.success("DOCX exportado!");
    } catch { toast.error("Erro ao exportar DOCX"); }
  };

  const handleSave = async () => {
    if (!user) { toast.error("Faça login para salvar"); return; }
    if (!gameData) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("documentos_salvos").insert({
        user_id: user.id,
        tipo: "jogo",
        titulo: `${selectedGameDef?.title}: ${tema || "Sem tema"}`,
        conteudo: { gameType: selectedGame, gameData, config: getConfig() } as any,
        disciplina: header.disciplina || null,
        nivel: difficulty,
      });
      if (error) throw error;
      toast.success("Jogo salvo com sucesso!");
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

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setHeader(h => ({ ...h, logoUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Maze question management
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
            <Gamepad2 className="h-6 w-6 text-primary" /> Fábrica de Jogos Pedagógicos
          </h1>
          <p className="text-muted-foreground mt-1">5 jogos educacionais em formato A4 para impressão</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map(game => (
            <Card
              key={game.id}
              className="shadow-card cursor-pointer transition-all hover:shadow-elevated hover:scale-[1.02]"
              onClick={() => { setSelectedGame(game.id); setGameData(null); setMode(game.supportsAI ? "ai" : "manual"); }}
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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedGame(null); setGameData(null); setPalavras(""); setMazeQuestions([]); }}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Jogos
        </Button>
        <h1 className="font-display text-lg font-bold flex items-center gap-2">
          {selectedGameDef && <selectedGameDef.icon className="h-5 w-5 text-primary" />}
          {selectedGameDef?.title}
        </h1>
      </div>

      <div className="flex gap-4 items-start" style={{ minHeight: "calc(100vh - 180px)" }}>
        {/* LEFT: Config */}
        <div className="w-[360px] shrink-0 sticky top-4 space-y-3 overflow-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
          <Card className="shadow-card">
            <CardContent className="p-4 space-y-3">
              {/* Mode toggle */}
              {selectedGameDef?.supportsAI && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Modo de Geração</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={() => setMode("ai")} className={`flex items-center justify-center gap-1.5 rounded-md border p-2.5 text-[11px] font-medium transition-all ${mode === "ai" ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border hover:border-muted-foreground/40"}`}>
                      <Wand2 className="h-3.5 w-3.5" /> Gerar com IA
                    </button>
                    <button onClick={() => setMode("manual")} className={`flex items-center justify-center gap-1.5 rounded-md border p-2.5 text-[11px] font-medium transition-all ${mode === "manual" ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border hover:border-muted-foreground/40"}`}>
                      <Edit3 className="h-3.5 w-3.5" /> Manual
                    </button>
                  </div>
                </div>
              )}

              {/* Color mode */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Palette className="h-3 w-3" /> Modo de Cor
                </Label>
                <div className="flex gap-1">
                  <button onClick={() => setColorMode("color")} className={`px-2 py-1 rounded text-[10px] border ${colorMode === "color" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                    Colorido
                  </button>
                  <button onClick={() => setColorMode("grayscale")} className={`px-2 py-1 rounded text-[10px] border ${colorMode === "grayscale" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                    Economia
                  </button>
                </div>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Cabeçalho / Timbre</Label>
                <Switch checked={header.showHeader} onCheckedChange={v => setHeader(h => ({ ...h, showHeader: v }))} />
              </div>
              {header.showHeader && (
                <div className="space-y-2 border-t pt-2">
                  <div>
                    <Label className="text-[10px]">Logo da Escola (opcional)</Label>
                    <Input type="file" accept="image/*" onChange={handleLogoUpload} className="h-8 text-xs" />
                    {header.logoUrl && <img src={header.logoUrl} alt="Logo" className="h-8 mt-1 object-contain" />}
                  </div>
                  <Input placeholder="Nome da Escola" value={header.escola} onChange={e => setHeader(h => ({ ...h, escola: e.target.value }))} className="h-8 text-xs" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Professor(a)" value={header.professor} onChange={e => setHeader(h => ({ ...h, professor: e.target.value }))} className="h-8 text-xs" />
                    <Input placeholder="Disciplina" value={header.disciplina} onChange={e => setHeader(h => ({ ...h, disciplina: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Série/Turma" value={header.serie} onChange={e => setHeader(h => ({ ...h, serie: e.target.value }))} className="h-8 text-xs" />
                    <Input placeholder="Data" value={header.data} onChange={e => setHeader(h => ({ ...h, data: e.target.value }))} className="h-8 text-xs" />
                  </div>
                </div>
              )}

              {/* Tema */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tema</Label>
                <Input
                  placeholder={mode === "ai" ? "Ex: Hardware, Sistema Solar, Revolução Industrial" : "Ex: Animais"}
                  value={tema} onChange={e => setTema(e.target.value)} className="h-8 text-xs"
                />
              </div>

              {/* Words */}
              {showWordsField && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Palavras-chave (vírgula)
                    {mode === "ai" && palavras.trim() && <span className="text-muted-foreground font-normal ml-1">— gerado pela IA</span>}
                  </Label>
                  <Textarea placeholder="CPU, RAM, SSD, PLACA" value={palavras} onChange={e => setPalavras(e.target.value)} className="min-h-[50px] text-xs" />
                </div>
              )}

              {/* Difficulty */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nível de Dificuldade</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.entries(difficultyConfig) as [Difficulty, typeof difficultyConfig.facil][]).map(([key, cfg]) => (
                    <button key={key} onClick={() => setDifficulty(key)}
                      className={`rounded-md border p-2 text-center transition-all text-[10px] ${difficulty === key ? "border-primary bg-primary/5 shadow-sm font-bold" : "border-border hover:border-muted-foreground/40"}`}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Game-specific options */}
              {selectedGame === "caca-palavras" && (
                <div className="space-y-2 border-t pt-2">
                  <Label className="text-xs font-semibold">Opções do Caça-Palavras</Label>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Tamanho da Grade</Label>
                    <Select value={gridSize} onValueChange={v => setGridSize(v as GridSize)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10x10">10×10 (Pequeno)</SelectItem>
                        <SelectItem value="15x15">15×15 (Médio)</SelectItem>
                        <SelectItem value="20x20">20×20 (Grande)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] flex items-center gap-1"><EyeOff className="h-3 w-3" /> Esconder lista de palavras</Label>
                    <Switch checked={hideWordList} onCheckedChange={setHideWordList} />
                  </div>
                </div>
              )}

              {selectedGame === "cruzadinha" && (
                <div className="space-y-2 border-t pt-2">
                  <Label className="text-xs font-semibold">Estilo de Dica</Label>
                  <Select value={hintStyle} onValueChange={v => setHintStyle(v as any)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto descritivo</SelectItem>
                      <SelectItem value="synonym">Sinônimo</SelectItem>
                      <SelectItem value="fill-blank">Preencha a lacuna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedGame === "criptograma" && (
                <div className="space-y-2 border-t pt-2">
                  <Label className="text-xs font-semibold">Tema dos Símbolos</Label>
                  <Select value={symbolTheme} onValueChange={v => setSymbolTheme(v as CryptoSymbolTheme)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">Números (1-26)</SelectItem>
                      <SelectItem value="math">Matemático (∑, ∆, π)</SelectItem>
                      <SelectItem value="emoji">Emojis (★, ♥, ♦)</SelectItem>
                      <SelectItem value="tech">Tecnologia (⌘, #, @)</SelectItem>
                    </SelectContent>
                  </Select>
                  {mode === "manual" && (
                    <div className="space-y-1">
                      <Label className="text-[10px]">Frase Secreta</Label>
                      <Textarea placeholder="A TECNOLOGIA TRANSFORMA O MUNDO" value={tema} onChange={e => setTema(e.target.value)} className="min-h-[40px] text-xs" />
                    </div>
                  )}
                </div>
              )}

              {selectedGame === "sudoku" && (
                <div className="space-y-2 border-t pt-2">
                  <Label className="text-xs font-semibold">Opções do Sudoku</Label>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Tamanho</Label>
                    <Select value={String(sudokuSize)} onValueChange={v => setSudokuSize(Number(v) as 4 | 6 | 9)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4×4 (Fácil)</SelectItem>
                        <SelectItem value="6">6×6 (Médio)</SelectItem>
                        <SelectItem value="9">9×9 (Clássico)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Conteúdo</Label>
                    <Select value={sudokuContentType} onValueChange={v => setSudokuContentType(v as any)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="numbers">Números</SelectItem>
                        <SelectItem value="shapes">Formas Geométricas</SelectItem>
                        <SelectItem value="words">Palavras Curtas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {sudokuContentType === "words" && (
                    <div className="space-y-1">
                      <Label className="text-[10px]">Símbolos ({sudokuSize} separados por vírgula)</Label>
                      <Input placeholder="HTML, CSS, JS, SQL" value={sudokuCustomSymbols} onChange={e => setSudokuCustomSymbols(e.target.value)} className="h-8 text-xs" />
                    </div>
                  )}
                </div>
              )}

              {selectedGame === "labirinto" && mode === "manual" && (
                <div className="space-y-2 border-t pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Perguntas de Bloqueio ({mazeQuestions.length}/5)</Label>
                    <Button variant="outline" size="sm" onClick={addMazeQuestion} className="h-6 text-[10px]">+ Pergunta</Button>
                  </div>
                  {mazeQuestions.map((q, qi) => (
                    <div key={qi} className="space-y-1 border rounded p-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold">Checkpoint {String.fromCharCode(65 + qi)}</span>
                        <button onClick={() => removeMazeQuestion(qi)} className="text-destructive text-[10px]">✕</button>
                      </div>
                      <Input placeholder="Pergunta..." value={q.question} onChange={e => updateMazeQuestion(qi, "question", e.target.value)} className="h-7 text-[10px]" />
                      {q.alternatives.map((alt, ai) => (
                        <div key={ai} className="flex gap-1 items-center">
                          <button onClick={() => updateMazeQuestion(qi, "correctIndex", ai)}
                            className={`w-5 h-5 rounded-full border text-[8px] flex items-center justify-center ${q.correctIndex === ai ? "bg-primary text-primary-foreground" : "border-border"}`}>
                            {String.fromCharCode(65 + ai)}
                          </button>
                          <Input placeholder={`Alternativa ${String.fromCharCode(65 + ai)}`} value={alt} onChange={e => updateMazeAlternative(qi, ai, e.target.value)} className="h-6 text-[10px] flex-1" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Button onClick={handleGenerate} disabled={generating} className="gradient-primary border-0 text-primary-foreground hover:opacity-90 h-9 text-xs">
                  {generating ? (
                    <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Gerando{mode === "ai" ? " com IA" : ""}...</>
                  ) : mode === "ai" && selectedGameDef?.supportsAI ? (
                    <><Wand2 className="mr-1 h-3 w-3" /> Gerar com IA</>
                  ) : (
                    <><Sparkles className="mr-1 h-3 w-3" /> Gerar Jogo</>
                  )}
                </Button>
                {gameData && (
                  <>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => { setGameData(null); setTimeout(handleGenerate, 100); }} className="h-8 text-[10px]">
                        <RotateCcw className="h-3 w-3 mr-1" /> Novo Layout
                      </Button>
                      <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 text-[10px]">
                        <Printer className="h-3 w-3 mr-1" /> Imprimir
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <Button variant="outline" size="sm" onClick={handlePDF} className="h-8 text-[10px]">
                        <FileDown className="h-3 w-3 mr-1" /> PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDOCX} className="h-8 text-[10px]">
                        <FileText className="h-3 w-3 mr-1" /> Word
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="h-8 text-[10px]">
                        <Save className="h-3 w-3 mr-1" /> {saving ? "..." : "Salvar"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Preview */}
        <div className="flex-1 min-w-0">
          <div className="bg-muted/30 rounded-lg p-4 flex justify-center overflow-auto">
            {gameData ? (
              <div className="shadow-elevated">{renderPreview()}</div>
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
