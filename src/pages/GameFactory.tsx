import { useState, useCallback } from "react";
import {
  Gamepad2, Search as SearchIcon, Grid3X3, Hash, MapPin, Palette,
  Sparkles, Loader2, Printer, RotateCcw, FileDown, ArrowLeft,
  Link2, PenLine, Brain, Table2, CheckSquare, Lock, Type, AlignLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
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
  { id: "cruzadinha", title: "Cruzadinha", icon: Hash, desc: "Grade com dicas horizontais e verticais", category: "words" as const, needsWords: true },
  { id: "caca-palavras", title: "Caça-Palavras", icon: SearchIcon, desc: "Encontre palavras escondidas na grade", category: "words" as const, needsWords: true },
  { id: "forca", title: "Forca", icon: Lock, desc: "6 forcas com dicas e linhas em branco", category: "words" as const, needsWords: true },
  { id: "sudoku", title: "Sudoku", icon: Grid3X3, desc: "Puzzles 4x4, 6x6 ou 9x9", category: "logic" as const },
  { id: "ligue-pares", title: "Ligue os Pares", icon: Link2, desc: "Associe colunas esquerda e direita", category: "words" as const, needsWords: true },
  { id: "complete-palavra", title: "Complete a Palavra", icon: PenLine, desc: "Preencha letras faltantes", category: "words" as const, needsWords: true },
  { id: "anagrama", title: "Anagramas", icon: Type, desc: "Descubra a palavra embaralhada", category: "words" as const, needsWords: true },
  { id: "sequencia", title: "Sequências Lógicas", icon: Brain, desc: "Complete o padrão numérico/visual", category: "logic" as const },
  { id: "cruzadinha-simples", title: "Cruzadinha Simplificada", icon: Grid3X3, desc: "Grade 10x10 aberta para vocabulário", category: "grid" as const, needsWords: true },
  { id: "velha-pedagogica", title: "Jogo da Velha Pedagógico", icon: Hash, desc: "Resolva antes de marcar X ou O", category: "grid" as const, needsWords: true },
  { id: "criptograma", title: "Criptograma", icon: Lock, desc: "Decifre a mensagem com tabela de códigos", category: "logic" as const },
  { id: "lacunas", title: "Preencha as Lacunas", icon: AlignLeft, desc: "Texto com espaços para completar (cloze)", category: "text" as const, needsWords: true },
  { id: "tabela-classificacao", title: "Tabela de Classificação", icon: Table2, desc: "Organize itens em 3 categorias", category: "text" as const, needsWords: true },
  { id: "verdadeiro-falso", title: "Verdadeiro ou Falso", icon: CheckSquare, desc: "Afirmações com [V] [F] + justificativa", category: "text" as const, needsWords: true },
  { id: "labirinto", title: "Labirinto", icon: MapPin, desc: "Encontre o caminho do início ao fim", category: "grid" as const },
  { id: "pixel-art", title: "Pixel Art", icon: Palette, desc: "Pinte coordenadas e revele o desenho", category: "grid" as const },
];

const CATEGORY_LABELS: Record<string, string> = {
  words: "📝 Palavras",
  logic: "🧠 Lógica",
  grid: "📐 Grades",
  text: "📄 Texto",
};

export default function GameFactory() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [tema, setTema] = useState("");
  const [palavras, setPalavras] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("facil");
  const [header, setHeader] = useState<GameHeader>({ ...defaultHeader });
  const [generating, setGenerating] = useState(false);
  const [gameData, setGameData] = useState<any>(null);

  const getConfig = useCallback((): GameConfig => ({
    tema, palavras, difficulty, header,
  }), [tema, palavras, difficulty, header]);

  const selectedGameDef = GAMES.find(g => g.id === selectedGame);

  const handleGenerate = () => {
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
                  onClick={() => { setSelectedGame(game.id); setGameData(null); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <game.icon className="h-4 w-4" />
                      </div>
                      <Badge variant="secondary" className="text-[10px]">A4</Badge>
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
                <Input placeholder="Ex: Sistema Solar, Animais" value={tema} onChange={e => setTema(e.target.value)} className="h-8 text-xs" />
              </div>

              {/* Words input */}
              {selectedGameDef?.needsWords && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Palavras-chave (vírgula)</Label>
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
                  {generating ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Gerando...</> : <><Sparkles className="mr-1 h-3 w-3" /> Gerar Jogo</>}
                </Button>
                {gameData && (
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => { setGameData(null); handleGenerate(); }} className="h-8 text-[10px]">
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
              <div className="bg-card shadow-lg flex items-center justify-center text-muted-foreground text-sm" style={{ width: "210mm", minHeight: "297mm", borderRadius: "4px" }}>
                <div className="text-center space-y-2">
                  <Gamepad2 className="h-12 w-12 mx-auto opacity-20" />
                  <p>Configure e clique em "Gerar Jogo"</p>
                  <p className="text-xs">O preview A4 aparecerá aqui</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
