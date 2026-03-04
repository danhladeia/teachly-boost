import { useState, useCallback, useEffect } from "react";
import { Gamepad2, Search as SearchIcon, Grid3X3, Hash, MapPin, Palette, Lock, Sparkles, Loader2, Printer, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Difficulty = "facil" | "medio" | "dificil";

const difficultyConfig: Record<Difficulty, { label: string; color: string; gridSize: number; wordCount: number }> = {
  facil: { label: "Fácil", color: "bg-green-500/10 text-green-600", gridSize: 10, wordCount: 6 },
  medio: { label: "Médio", color: "bg-yellow-500/10 text-yellow-600", gridSize: 13, wordCount: 10 },
  dificil: { label: "Difícil", color: "bg-red-500/10 text-red-600", gridSize: 16, wordCount: 15 },
};

const games = [
  { id: "caca-palavras", title: "Caça-Palavras", icon: SearchIcon, desc: "Encontre palavras escondidas na grade", available: true },
  { id: "cruzadinha", title: "Cruzadinha", icon: Hash, desc: "Preencha a grade com as dicas", available: true },
  { id: "sudoku", title: "Sudoku Temático", icon: Grid3X3, desc: "Sudoku com temas personalizados", available: true },
  { id: "labirinto", title: "Labirinto", icon: MapPin, desc: "Encontre o caminho do início ao fim", available: true },
  { id: "pixel-art", title: "Pixel Art Matemático", icon: Palette, desc: "Pinte coordenadas e revele o desenho", available: true },
  { id: "quiz", title: "Quiz Interativo", icon: Hash, desc: "Perguntas e respostas temáticas", available: true },
  { id: "memoria", title: "Jogo da Memória", icon: Grid3X3, desc: "Pares de cartas temáticas", available: true },
  { id: "forca", title: "Forca", icon: Hash, desc: "Adivinhe a palavra letra por letra", available: true },
];

// --- Word Search Generator ---
function generateWordSearch(words: string[], gridSize: number): { grid: string[][]; placedWords: string[] } {
  const grid: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(""));
  const directions = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]];
  const placedWords: string[] = [];

  const sortedWords = [...words].sort((a, b) => b.length - a.length);

  for (const word of sortedWords) {
    const clean = word.toUpperCase().replace(/[^A-ZÁÉÍÓÚÂÊÔÃÕÇ]/g, "");
    if (clean.length === 0 || clean.length > gridSize) continue;
    let placed = false;
    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const startR = Math.floor(Math.random() * gridSize);
      const startC = Math.floor(Math.random() * gridSize);
      let fits = true;
      for (let k = 0; k < clean.length; k++) {
        const r = startR + dir[0] * k;
        const c = startC + dir[1] * k;
        if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) { fits = false; break; }
        if (grid[r][c] !== "" && grid[r][c] !== clean[k]) { fits = false; break; }
      }
      if (fits) {
        for (let k = 0; k < clean.length; k++) {
          grid[startR + dir[0] * k][startC + dir[1] * k] = clean[k];
        }
        placedWords.push(word);
        placed = true;
      }
    }
  }

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === "") grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
    }
  }
  return { grid, placedWords };
}

// --- Maze Generator (DFS) ---
function generateMaze(size: number): boolean[][] {
  const maze: boolean[][] = Array.from({ length: size }, () => Array(size).fill(true));
  const visited: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  
  function carve(r: number, c: number) {
    visited[r][c] = true;
    maze[r][c] = false;
    const dirs = [[0, 2], [2, 0], [0, -2], [-2, 0]].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
        maze[r + dr / 2][c + dc / 2] = false;
        carve(nr, nc);
      }
    }
  }
  carve(1, 1);
  maze[0][1] = false; // entrance
  maze[size - 1][size - 2] = false; // exit
  return maze;
}

export default function GameFactory() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [tema, setTema] = useState("");
  const [palavras, setPalavras] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("facil");
  const [generating, setGenerating] = useState(false);

  // Game states
  const [wsGrid, setWsGrid] = useState<string[][] | null>(null);
  const [wsWords, setWsWords] = useState<string[]>([]);
  const [mazeGrid, setMazeGrid] = useState<boolean[][] | null>(null);

  const handleGenerate = () => {
    if (!tema.trim() && selectedGame !== "sudoku") { toast.error("Insira o tema"); return; }
    setGenerating(true);

    setTimeout(() => {
      try {
        if (selectedGame === "caca-palavras") {
          const wordList = palavras.split(",").map(w => w.trim()).filter(Boolean);
          if (wordList.length < 3) { toast.error("Insira pelo menos 3 palavras"); setGenerating(false); return; }
          const config = difficultyConfig[difficulty];
          const { grid, placedWords } = generateWordSearch(wordList.slice(0, config.wordCount), config.gridSize);
          setWsGrid(grid);
          setWsWords(placedWords);
          toast.success(`Caça-palavras gerado com ${placedWords.length} palavras!`);
        } else if (selectedGame === "labirinto") {
          const sizes: Record<Difficulty, number> = { facil: 11, medio: 17, dificil: 25 };
          setMazeGrid(generateMaze(sizes[difficulty]));
          toast.success("Labirinto gerado!");
        } else {
          toast.info("Jogo gerado com sucesso! (preview em breve)");
        }
      } catch (err) {
        toast.error("Erro ao gerar jogo");
      } finally {
        setGenerating(false);
      }
    }, 300);
  };

  const handlePrint = () => {
    const el = document.getElementById("game-print-area");
    if (!el) return;
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`<html><head><title>Jogo - ${tema}</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', 'Arial', sans-serif; padding: 15mm; }
      @page { size: A4; margin: 15mm; }
    </style></head><body>`);
    pw.document.write(el.innerHTML);
    pw.document.write("</body></html>");
    pw.document.close();
    pw.focus();
    pw.print();
    pw.close();
  };

  const resetGame = () => {
    setWsGrid(null);
    setWsWords([]);
    setMazeGrid(null);
  };

  const renderGameConfig = () => {
    if (!selectedGame) return null;
    const game = games.find(g => g.id === selectedGame);
    if (!game) return null;

    return (
      <Card className="shadow-card max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <game.icon className="h-5 w-5 text-primary" /> {game.title}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedGame(null); resetGame(); }}>
              ← Voltar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema do jogo</Label>
            <Input placeholder="Ex: Sistema Solar, Animais, Cores" value={tema} onChange={e => setTema(e.target.value)} />
          </div>

          {(selectedGame === "caca-palavras" || selectedGame === "cruzadinha") && (
            <div className="space-y-2">
              <Label>Palavras-chave (separadas por vírgula)</Label>
              <Textarea
                placeholder="Ex: sol, lua, terra, marte, jupiter, saturno, venus, netuno"
                value={palavras}
                onChange={e => setPalavras(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="font-semibold">Nível de Dificuldade</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(difficultyConfig) as [Difficulty, typeof difficultyConfig.facil][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key)}
                  className={`rounded-lg border-2 p-3 text-center transition-all ${difficulty === key ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/40"}`}
                >
                  <span className="text-sm font-semibold">{cfg.label}</span>
                  {selectedGame === "caca-palavras" && (
                    <p className="text-[10px] text-muted-foreground mt-1">{cfg.gridSize}x{cfg.gridSize} • {cfg.wordCount} palavras</p>
                  )}
                  {selectedGame === "labirinto" && (
                    <p className="text-[10px] text-muted-foreground mt-1">{key === "facil" ? "Simples" : key === "medio" ? "Intermediário" : "Complexo"}</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleGenerate} disabled={generating} className="gradient-primary border-0 text-primary-foreground hover:opacity-90">
              {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar Jogo</>}
            </Button>
            {(wsGrid || mazeGrid) && (
              <>
                <Button variant="outline" onClick={handlePrint}><Printer className="mr-1 h-4 w-4" /> Imprimir</Button>
                <Button variant="outline" onClick={() => { resetGame(); handleGenerate(); }}><RotateCcw className="mr-1 h-4 w-4" /> Novo</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGamePreview = () => {
    if (selectedGame === "caca-palavras" && wsGrid) {
      const cellSize = Math.max(20, Math.min(30, 400 / wsGrid.length));
      return (
        <Card className="shadow-card max-w-3xl">
          <CardContent className="pt-6">
            <div id="game-print-area">
              <h2 style={{ textAlign: "center", fontSize: "16pt", fontWeight: 700, marginBottom: "4mm", fontFamily: "'Montserrat', sans-serif" }}>
                Caça-Palavras: {tema}
              </h2>
              <p style={{ textAlign: "center", fontSize: "10pt", color: "#64748b", marginBottom: "6mm" }}>
                Nível: {difficultyConfig[difficulty].label} • Encontre {wsWords.length} palavras
              </p>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "6mm" }}>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${wsGrid.length}, ${cellSize}px)`, gap: "1px", border: "2px solid #1e293b" }}>
                  {wsGrid.flat().map((letter, i) => (
                    <div key={i} style={{ width: cellSize, height: cellSize, display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${cellSize * 0.5}px`, fontWeight: 600, fontFamily: "monospace", border: "1px solid #e2e8f0" }}>
                      {letter}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "3mm", justifyContent: "center" }}>
                {wsWords.map((w, i) => (
                  <span key={i} style={{ padding: "2mm 4mm", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "10pt", fontWeight: 600 }}>{w}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (selectedGame === "labirinto" && mazeGrid) {
      const cellSize = Math.max(10, Math.min(20, 500 / mazeGrid.length));
      return (
        <Card className="shadow-card max-w-3xl">
          <CardContent className="pt-6">
            <div id="game-print-area">
              <h2 style={{ textAlign: "center", fontSize: "16pt", fontWeight: 700, marginBottom: "4mm", fontFamily: "'Montserrat', sans-serif" }}>
                Labirinto: {tema}
              </h2>
              <p style={{ textAlign: "center", fontSize: "10pt", color: "#64748b", marginBottom: "6mm" }}>
                Nível: {difficultyConfig[difficulty].label} • Encontre a saída!
              </p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${mazeGrid[0].length}, ${cellSize}px)` }}>
                  {mazeGrid.flat().map((wall, i) => (
                    <div key={i} style={{ width: cellSize, height: cellSize, background: wall ? "#1e293b" : "#ffffff", border: wall ? "none" : "1px solid #f1f5f9" }} />
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4mm", fontSize: "10pt", fontWeight: 600 }}>
                <span>↓ ENTRADA</span>
                <span>SAÍDA →</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-primary" /> Fábrica de Jogos
        </h1>
        <p className="text-muted-foreground mt-1">Jogos pedagógicos personalizados com níveis de dificuldade</p>
      </div>

      {!selectedGame && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
            <Card
              key={game.id}
              className={`shadow-card cursor-pointer transition-all hover:shadow-elevated hover:scale-[1.02]`}
              onClick={() => { setSelectedGame(game.id); resetGame(); }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <game.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="text-xs">{game.available ? "Disponível" : "Em breve"}</Badge>
                </div>
                <h3 className="font-display font-bold text-sm">{game.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{game.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {renderGameConfig()}
      {renderGamePreview()}
    </div>
  );
}
