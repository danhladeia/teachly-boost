import { useState, useCallback } from "react";
import {
  Gamepad2, Search as SearchIcon, Grid3X3, Hash, MapPin, Palette,
  Sparkles, Loader2, Printer, RotateCcw, FileDown, ArrowLeft,
  Link2, PenLine, Brain, Table2, CheckSquare, Lock, Type, AlignLeft,
  Wand2, Edit3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { difficultyConfig, defaultHeader, type Difficulty, type GameConfig, type GameHeader } from "@/components/games/types";

// Generators
import { generateWordSearch } from "@/components/games/generators/wordSearch";
import { generateCrossword } from "@/components/games/generators/crossword";
import { generateSudoku } from "@/components/games/generators/sudoku";
import { generateMaze } from "@/components/games/generators/maze";
import { generateHangman } from "@/components/games/generators/hangman";
import { generateConnectPairs } from "@/components/games/generators/connectPairs";
import { generateCompleteWord } from "@/components/games/generators/completeWord";
import { generateAnagram } from "@/components/games/generators/anagram";
import { generateLogicalSequence } from "@/components/games/generators/logicalSequence";
import { generateSimpleCrossword } from "@/components/games/generators/simpleCrossword";
import { generateTicTacToe } from "@/components/games/generators/ticTacToe";
import { generateCryptogram } from "@/components/games/generators/cryptogram";
import { generateFillBlanks } from "@/components/games/generators/fillBlanks";
import { generateClassificationTable } from "@/components/games/generators/classificationTable";
import { generateTrueFalse } from "@/components/games/generators/trueFalse";
import { generatePixelArt } from "@/components/games/generators/pixelArt";

// Previews
import WordSearchPreview from "@/components/games/previews/WordSearchPreview";
import CrosswordPreview from "@/components/games/previews/CrosswordPreview";
import SudokuPreview from "@/components/games/previews/SudokuPreview";
import MazePreview from "@/components/games/previews/MazePreview";
import HangmanPreview from "@/components/games/previews/HangmanPreview";
import ConnectPairsPreview from "@/components/games/previews/ConnectPairsPreview";
import CompleteWordPreview from "@/components/games/previews/CompleteWordPreview";
import AnagramPreview from "@/components/games/previews/AnagramPreview";
import LogicalSequencePreview from "@/components/games/previews/LogicalSequencePreview";
import SimpleCrosswordPreview from "@/components/games/previews/SimpleCrosswordPreview";
import TicTacToePreview from "@/components/games/previews/TicTacToePreview";
import CryptogramPreview from "@/components/games/previews/CryptogramPreview";
import FillBlanksPreview from "@/components/games/previews/FillBlanksPreview";
import ClassificationTablePreview from "@/components/games/previews/ClassificationTablePreview";
import TrueFalsePreview from "@/components/games/previews/TrueFalsePreview";
import PixelArtPreview from "@/components/games/previews/PixelArtPreview";

const GAMES = [
  { id: "cruzadinha", title: "Cruzadinha", icon: Hash, desc: "Grade com dicas horizontais e verticais", category: "words" as const, needsWords: true, supportsAI: true },
  { id: "caca-palavras", title: "Caça-Palavras", icon: SearchIcon, desc: "Encontre palavras escondidas na grade", category: "words" as const, needsWords: true, supportsAI: true },
  { id: "forca", title: "Forca", icon: Lock, desc: "6 forcas com dicas e linhas em branco", category: "words" as const, needsWords: true, supportsAI: true },
  { id: "sudoku", title: "Sudoku", icon: Grid3X3, desc: "Puzzles 4x4, 6x6 ou 9x9", category: "logic" as const, supportsAI: false },
  { id: "ligue-pares", title: "Ligue os Pares", icon: Link2, desc: "Associe colunas esquerda e direita", category: "words" as const, needsWords: true, supportsAI: true },
  { id: "complete-palavra", title: "Complete a Palavra", icon: PenLine, desc: "Preencha letras faltantes", category: "words" as const, needsWords: true, supportsAI: true },
  { id: "anagrama", title: "Anagramas", icon: Type, desc: "Descubra a palavra embaralhada", category: "words" as const, needsWords: true, supportsAI: true },
  { id: "sequencia", title: "Sequências Lógicas", icon: Brain, desc: "Complete o padrão numérico/visual", category: "logic" as const, supportsAI: true },
  { id: "cruzadinha-simples", title: "Cruzadinha Simplificada", icon: Grid3X3, desc: "Grade 10x10 aberta para vocabulário", category: "grid" as const, needsWords: true, supportsAI: true },
  { id: "velha-pedagogica", title: "Jogo da Velha Pedagógico", icon: Hash, desc: "Resolva antes de marcar X ou O", category: "grid" as const, needsWords: true, supportsAI: true },
  { id: "criptograma", title: "Criptograma", icon: Lock, desc: "Decifre a mensagem com tabela de códigos", category: "logic" as const, supportsAI: true },
  { id: "lacunas", title: "Preencha as Lacunas", icon: AlignLeft, desc: "Texto com espaços para completar (cloze)", category: "text" as const, needsWords: true, supportsAI: true },
  { id: "tabela-classificacao", title: "Tabela de Classificação", icon: Table2, desc: "Organize itens em 3 categorias", category: "text" as const, needsWords: true, supportsAI: true },
  { id: "verdadeiro-falso", title: "Verdadeiro ou Falso", icon: CheckSquare, desc: "Afirmações com [V] [F] + justificativa", category: "text" as const, needsWords: true, supportsAI: true },
  { id: "labirinto", title: "Labirinto", icon: MapPin, desc: "Encontre o caminho do início ao fim", category: "grid" as const, supportsAI: false },
  { id: "pixel-art", title: "Pixel Art", icon: Palette, desc: "Pinte coordenadas e revele o desenho", category: "grid" as const, supportsAI: false },
];

const CATEGORY_LABELS: Record<string, string> = {
  words: "📝 Palavras",
  logic: "🧠 Lógica",
  grid: "📐 Grades",
  text: "📄 Texto",
};

// AI data processors: take AI response and inject into config to feed generators
function processAIData(gameType: string, aiData: any, config: GameConfig): GameConfig {
  const c = { ...config };

  switch (gameType) {
    case "cruzadinha":
    case "caca-palavras":
    case "complete-palavra":
    case "anagrama":
    case "cruzadinha-simples":
      c.palavras = (aiData.palavras || []).join(", ");
      // Store hints for crossword
      if (aiData.dicas) c._aiHints = aiData.dicas;
      break;

    case "forca":
      if (aiData.items) {
        c.palavras = aiData.items.map((it: any) => it.word).join(", ");
        c._aiHangmanItems = aiData.items;
      }
      break;

    case "ligue-pares":
      if (aiData.pairs) {
        c.palavras = aiData.pairs.map((p: any) => `${p.left}, ${p.right}`).join(", ");
        c._aiPairs = aiData.pairs;
      }
      break;

    case "velha-pedagogica":
      if (aiData.perguntas) {
        c.palavras = aiData.perguntas.join(", ");
      }
      break;

    case "criptograma":
      if (aiData.mensagem) {
        c.tema = aiData.mensagem;
        c._aiCryptogramMessage = aiData.mensagem;
      }
      break;

    case "lacunas":
      if (aiData.texto && aiData.palavras_chave) {
        c.palavras = aiData.palavras_chave.join(", ");
        c._aiFillText = aiData.texto;
        c._aiFillWords = aiData.palavras_chave;
      }
      break;

    case "tabela-classificacao":
      if (aiData.headers && aiData.items) {
        c.palavras = aiData.items.join(", ");
        c._aiHeaders = aiData.headers;
      }
      break;

    case "verdadeiro-falso":
      if (aiData.items) {
        c.palavras = aiData.items.map((it: any) => it.statement).join(", ");
        c._aiTrueFalseItems = aiData.items;
      }
      break;

    case "sequencia":
      if (aiData.items) {
        c._aiSequenceItems = aiData.items;
      }
      break;
  }

  return c;
}

export default function GameFactory() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [tema, setTema] = useState("");
  const [palavras, setPalavras] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("facil");
  const [header, setHeader] = useState<GameHeader>({ ...defaultHeader });
  const [generating, setGenerating] = useState(false);
  const [gameData, setGameData] = useState<any>(null);
  const [mode, setMode] = useState<"ai" | "manual">("ai");

  const getConfig = useCallback((): GameConfig => ({
    tema, palavras, difficulty, header,
  }), [tema, palavras, difficulty, header]);

  const selectedGameDef = GAMES.find(g => g.id === selectedGame);

  const generators: Record<string, (c: GameConfig) => any> = {
    "cruzadinha": generateCrossword,
    "caca-palavras": generateWordSearch,
    "forca": generateHangman,
    "sudoku": generateSudoku,
    "ligue-pares": generateConnectPairs,
    "complete-palavra": generateCompleteWord,
    "anagrama": generateAnagram,
    "sequencia": generateLogicalSequence,
    "cruzadinha-simples": generateSimpleCrossword,
    "velha-pedagogica": generateTicTacToe,
    "criptograma": generateCryptogram,
    "lacunas": generateFillBlanks,
    "tabela-classificacao": generateClassificationTable,
    "verdadeiro-falso": generateTrueFalse,
    "labirinto": generateMaze,
    "pixel-art": generatePixelArt,
  };

  const handleGenerateManual = () => {
    if (!tema.trim() && selectedGame !== "sudoku" && selectedGame !== "sequencia") {
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
    if (!tema.trim()) {
      toast.error("Insira o tema para gerar com IA"); return;
    }
    setGenerating(true);
    try {
      const dc = difficultyConfig[difficulty];
      const { data: aiData, error } = await supabase.functions.invoke("generate-game", {
        body: {
          gameType: selectedGame,
          tema,
          difficulty,
          count: dc.wordCount,
        },
      });

      if (error) throw error;
      if (aiData?.error) {
        toast.error(aiData.error);
        setGenerating(false);
        return;
      }

      // Process AI response into config and generate
      const config = getConfig();
      const enrichedConfig = processAIData(selectedGame!, aiData, config);

      // For games with direct AI data (like sequences, true/false), use special generators
      const gen = generators[selectedGame!];
      if (gen) {
        // Update palavras state so user can see/edit what AI generated
        if (enrichedConfig.palavras !== config.palavras) {
          setPalavras(enrichedConfig.palavras);
        }

        // Generate game with enriched config
        let result;

        // Special handling for games that need AI-enriched data
        if (selectedGame === "forca" && enrichedConfig._aiHangmanItems) {
          result = {
            items: enrichedConfig._aiHangmanItems.map((it: any) => ({
              word: it.word.toUpperCase(),
              hint: it.hint,
            })),
            tema: enrichedConfig.tema,
          };
        } else if (selectedGame === "ligue-pares" && enrichedConfig._aiPairs) {
          const pairs = enrichedConfig._aiPairs;
          const shuffledRight = [...pairs.map((p: any) => p.right)].sort(() => Math.random() - 0.5);
          result = { pairs, shuffledRight, tema: enrichedConfig.tema };
        } else if (selectedGame === "verdadeiro-falso" && enrichedConfig._aiTrueFalseItems) {
          result = {
            items: enrichedConfig._aiTrueFalseItems.map((it: any) => ({
              statement: it.statement,
              answer: it.answer,
              justification: it.justification,
            })),
            tema: enrichedConfig.tema,
          };
        } else if (selectedGame === "lacunas" && enrichedConfig._aiFillText) {
          const text = enrichedConfig._aiFillText;
          const words = enrichedConfig._aiFillWords;
          const blankedText = words.reduce((t: string, w: string) =>
            t.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "______"), text);
          result = {
            paragraphs: [{ text: blankedText, blanks: words }],
            tema: enrichedConfig.tema,
          };
        } else if (selectedGame === "tabela-classificacao" && enrichedConfig._aiHeaders) {
          result = {
            headers: enrichedConfig._aiHeaders,
            items: enrichedConfig.palavras.split(",").map((w: string) => w.trim()).filter(Boolean),
            tema: enrichedConfig.tema,
          };
        } else if (selectedGame === "sequencia" && enrichedConfig._aiSequenceItems) {
          result = {
            items: enrichedConfig._aiSequenceItems,
            tema: enrichedConfig.tema,
          };
        } else if (selectedGame === "cruzadinha" && enrichedConfig._aiHints) {
          // Generate crossword with AI words but also inject AI hints
          const baseResult = gen(enrichedConfig);
          // Replace generic hints with AI-generated ones
          const hintMap = new Map(enrichedConfig._aiHints.map((h: any) => [h.palavra?.toUpperCase(), h.dica]));
          baseResult.clues = baseResult.clues.map((clue: any) => ({
            ...clue,
            hint: hintMap.get(clue.word) || clue.hint,
          }));
          result = baseResult;
        } else {
          result = gen(enrichedConfig);
        }

        setGameData(result);
        toast.success("🤖 Jogo gerado com IA!");
      }
    } catch (e: any) {
      console.error("AI generation error:", e);
      toast.error("Erro ao gerar com IA. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (mode === "ai" && selectedGameDef?.supportsAI) {
      handleGenerateAI();
    } else {
      handleGenerateManual();
    }
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
        margin: [10, 10, 10, 10],
        filename: `${tema || "jogo"}-${selectedGame}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }).from(el).save();
      toast.success("PDF exportado!");
    } catch {
      toast.error("Erro ao exportar PDF");
    }
  };

  const renderPreview = () => {
    if (!gameData || !selectedGame) return null;
    const config = getConfig();
    const previews: Record<string, React.ReactNode> = {
      "caca-palavras": <WordSearchPreview data={gameData} config={config} />,
      "cruzadinha": <CrosswordPreview data={gameData} config={config} />,
      "sudoku": <SudokuPreview data={gameData} config={config} />,
      "labirinto": <MazePreview data={gameData} config={config} />,
      "forca": <HangmanPreview data={gameData} config={config} />,
      "ligue-pares": <ConnectPairsPreview data={gameData} config={config} />,
      "complete-palavra": <CompleteWordPreview data={gameData} config={config} />,
      "anagrama": <AnagramPreview data={gameData} config={config} />,
      "sequencia": <LogicalSequencePreview data={gameData} config={config} />,
      "cruzadinha-simples": <SimpleCrosswordPreview data={gameData} config={config} />,
      "velha-pedagogica": <TicTacToePreview data={gameData} config={config} />,
      "criptograma": <CryptogramPreview data={gameData} config={config} />,
      "lacunas": <FillBlanksPreview data={gameData} config={config} />,
      "tabela-classificacao": <ClassificationTablePreview data={gameData} config={config} />,
      "verdadeiro-falso": <TrueFalsePreview data={gameData} config={config} />,
      "pixel-art": <PixelArtPreview data={gameData} config={config} />,
    };
    return previews[selectedGame] || null;
  };

  // --- GAME SELECTOR GRID ---
  if (!selectedGame) {
    const categories = [...new Set(GAMES.map(g => g.category))];
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-primary" /> Fábrica de Jogos Pedagógicos
          </h1>
          <p className="text-muted-foreground mt-1">15 atividades impressas de alta qualidade em formato A4</p>
        </div>
        {categories.map(cat => (
          <div key={cat}>
            <h2 className="font-display font-bold text-sm text-muted-foreground mb-3">{CATEGORY_LABELS[cat]}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {GAMES.filter(g => g.category === cat).map(game => (
                <Card
                  key={game.id}
                  className="shadow-card cursor-pointer transition-all hover:shadow-elevated hover:scale-[1.02]"
                  onClick={() => { setSelectedGame(game.id); setGameData(null); setMode(game.supportsAI ? "ai" : "manual"); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <game.icon className="h-4 w-4" />
                      </div>
                      <div className="flex gap-1">
                        {game.supportsAI && <Badge variant="secondary" className="text-[10px]">🤖 IA</Badge>}
                        <Badge variant="outline" className="text-[10px]">A4</Badge>
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-sm">{game.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{game.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const showWordsField = mode === "manual" && selectedGameDef?.needsWords;

  // --- SPLIT-SCREEN EDITOR ---
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedGame(null); setGameData(null); }}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Jogos
        </Button>
        <h1 className="font-display text-lg font-bold flex items-center gap-2">
          {selectedGameDef && <selectedGameDef.icon className="h-5 w-5 text-primary" />}
          {selectedGameDef?.title}
        </h1>
      </div>

      <div className="flex gap-4 items-start" style={{ minHeight: "calc(100vh - 180px)" }}>
        {/* LEFT: Config Panel (sticky) */}
        <div className="w-[340px] shrink-0 sticky top-4 space-y-3 overflow-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
          <Card className="shadow-card">
            <CardContent className="p-4 space-y-3">
              {/* AI vs Manual Mode Toggle */}
              {selectedGameDef?.supportsAI && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Modo de Geração</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setMode("ai")}
                      className={`flex items-center justify-center gap-1.5 rounded-md border p-2.5 text-[11px] font-medium transition-all ${
                        mode === "ai"
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      Gerar com IA
                    </button>
                    <button
                      onClick={() => setMode("manual")}
                      className={`flex items-center justify-center gap-1.5 rounded-md border p-2.5 text-[11px] font-medium transition-all ${
                        mode === "manual"
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Manual
                    </button>
                  </div>
                  {mode === "ai" && (
                    <p className="text-[10px] text-muted-foreground bg-muted/50 rounded p-2">
                      🤖 A IA vai gerar palavras, dicas e conteúdo baseados no tema e nível. Você pode editar tudo depois.
                    </p>
                  )}
                </div>
              )}

              {/* Header toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Cabeçalho Escolar</Label>
                <Switch checked={header.showHeader} onCheckedChange={v => setHeader(h => ({ ...h, showHeader: v }))} />
              </div>

              {header.showHeader && (
                <div className="space-y-2 border-t pt-2">
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

              {/* Theme */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tema</Label>
                <Input
                  placeholder={mode === "ai" ? "Ex: Sistema Solar, Animais, Revolução Industrial" : "Ex: Sistema Solar, Animais"}
                  value={tema}
                  onChange={e => setTema(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              {/* Words input - only in manual mode (or always visible for editing after AI gen) */}
              {(showWordsField || (selectedGameDef?.needsWords && palavras.trim())) && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Palavras-chave (vírgula)
                    {mode === "ai" && palavras.trim() && (
                      <span className="text-muted-foreground font-normal ml-1">— gerado pela IA, edite se quiser</span>
                    )}
                  </Label>
                  <Textarea
                    placeholder="sol, lua, terra, marte, jupiter"
                    value={palavras}
                    onChange={e => setPalavras(e.target.value)}
                    className="min-h-[50px] text-xs"
                  />
                </div>
              )}

              {/* Difficulty */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nível de Dificuldade</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.entries(difficultyConfig) as [Difficulty, typeof difficultyConfig.facil][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setDifficulty(key)}
                      className={`rounded-md border p-2 text-center transition-all text-[10px] ${
                        difficulty === key
                          ? "border-primary bg-primary/5 shadow-sm font-bold"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

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
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => { setGameData(null); setTimeout(handleGenerate, 100); }} className="h-8 text-[10px]">
                      <RotateCcw className="h-3 w-3 mr-1" /> Novo
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 text-[10px]">
                      <Printer className="h-3 w-3 mr-1" /> Print
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePDF} className="h-8 text-[10px]">
                      <FileDown className="h-3 w-3 mr-1" /> PDF
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: A4 Live Preview */}
        <div className="flex-1 min-w-0">
          <div className="bg-muted/30 rounded-lg p-4 flex justify-center overflow-auto">
            {gameData ? (
              <div className="shadow-elevated">
                {renderPreview()}
              </div>
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
