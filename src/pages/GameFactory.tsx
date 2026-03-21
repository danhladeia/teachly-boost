import { useState, useCallback } from "react";
import { ArrowLeft, Printer, FileDown, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useDocumentLimits } from "@/hooks/useDocumentLimits";
import ResponsiveA4Wrapper from "@/components/ResponsiveA4Wrapper";
import GameSelector, { GAMES } from "@/components/games/GameSelector";
import GameConfigPanel, { type GameConfigState, getDefaultConfig, toGameConfig } from "@/components/games/GameConfigPanel";
import { getWordSearchDefaults } from "@/components/games/types";
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

const generators: Record<string, (c: any) => any> = {
  "caca-palavras": generateWordSearch,
  "cruzadinha": generateCrossword,
  "criptograma": generateCryptogram,
  "sudoku": generateSudoku,
  "labirinto": generateMaze,
};

export default function GameFactory() {
  const { user } = useAuth();
  const { canUseAI, deductCredit } = useCredits();
  const docLimits = useDocumentLimits();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [config, setConfig] = useState<GameConfigState>(getDefaultConfig());
  const [gameData, setGameData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  const gameDef = GAMES.find(g => g.id === selectedGame);

  const updateConfig = useCallback((partial: Partial<GameConfigState>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  const handleSelectGame = (id: string) => {
    const game = GAMES.find(g => g.id === id);
    const defaults = getDefaultConfig();
    defaults.mode = game?.supportsAI ? "ai" : "manual";
    const wsDefs = getWordSearchDefaults(defaults.etapa, defaults.difficulty);
    defaults.gridSize = wsDefs.gridSize;
    defaults.directions = wsDefs.directions;
    setConfig(defaults);
    setSelectedGame(id);
    setGameData(null);
    setShowAnswerKey(false);
  };

  const handleBack = () => {
    setSelectedGame(null);
    setGameData(null);
    setConfig(getDefaultConfig());
  };

  // --- Manual generation ---
  const generateManual = () => {
    if (!config.tema.trim() && selectedGame !== "sudoku") { toast.error("Insira o tema"); return; }
    if (gameDef?.needsWords && !config.palavras.trim()) { toast.error("Insira as palavras-chave separadas por vírgula"); return; }
    setGenerating(true);
    setTimeout(() => {
      try {
        const gen = generators[selectedGame!];
        if (gen) { setGameData(gen(toGameConfig(config))); toast.success("Jogo gerado!"); }
      } catch { toast.error("Erro ao gerar"); }
      finally { setGenerating(false); }
    }, 200);
  };

  // --- AI generation ---
  const generateAI = async () => {
    if (!config.tema.trim()) { toast.error("Insira o tema"); return; }
    if (!canUseAI) { toast.error("Limite atingido. Faça upgrade para continuar."); return; }
    setGenerating(true);
    try {
      const ok = await deductCredit();
      if (!ok) { toast.error("Sem créditos disponíveis."); setGenerating(false); return; }
      const wsDefs = getWordSearchDefaults(config.etapa, config.difficulty);
      const { data: aiData, error } = await supabase.functions.invoke("generate-game", {
        body: { gameType: selectedGame, tema: config.tema, difficulty: config.difficulty, etapa: config.etapa, count: wsDefs.wordCount },
      });
      if (error) throw error;
      if (aiData?.error) { toast.error(aiData.error); setGenerating(false); return; }

      const gc = toGameConfig(config);

      if (selectedGame === "caca-palavras" && aiData.palavras) {
        const enriched = { ...gc, palavras: aiData.palavras.join(", ") };
        updateConfig({ palavras: enriched.palavras });
        setGameData(generateWordSearch(enriched));
      } else if (selectedGame === "cruzadinha" && aiData.palavras) {
        const enriched = { ...gc, palavras: aiData.palavras.join(", "), _aiHints: aiData.dicas };
        updateConfig({ palavras: enriched.palavras });
        setGameData(generateCrossword(enriched));
      } else if (selectedGame === "criptograma" && aiData.mensagem) {
        setGameData(generateCryptogram({ ...gc, _aiCryptogramMessage: aiData.mensagem }));
      } else {
        const gen = generators[selectedGame!];
        if (gen) setGameData(gen(gc));
      }
      toast.success("🤖 Jogo gerado com IA!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar com IA");
    } finally { setGenerating(false); }
  };

  const handleGenerate = () => {
    if (config.mode === "ai" && gameDef?.supportsAI) generateAI();
    else generateManual();
  };

  const handleRegenerate = () => {
    setGameData(null);
    setTimeout(handleGenerate, 100);
  };

  // --- Print ---
  const handlePrint = () => {
    const el = document.getElementById("game-print-area");
    const ak = document.getElementById("answer-key-area");
    if (!el) return;
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`<html><head><title>${config.tema || "Jogo"}</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      @page { size: A4; margin: 15mm; }
      body { font-family: 'Inter', 'Arial', sans-serif; }
    </style></head><body>`);
    pw.document.write(el.innerHTML);
    if (ak && config.answerKey !== "none") pw.document.write(ak.innerHTML);
    pw.document.write("</body></html>");
    pw.document.close();
    pw.focus();
    pw.print();
    pw.close();
  };

  // --- PDF ---
  const handlePDF = async () => {
    const el = document.getElementById("game-print-area");
    if (!el) return;
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const container = document.createElement("div");
      const gameClone = el.cloneNode(true) as HTMLElement;
      gameClone.style.cssText = "width:210mm;min-height:297mm;max-height:297mm;padding:20mm 15mm;box-sizing:border-box;overflow:hidden;background:#fff;position:relative";
      container.appendChild(gameClone);

      if (config.answerKey !== "none") {
        const ak = document.getElementById("answer-key-area");
        if (ak) {
          const akClone = ak.cloneNode(true) as HTMLElement;
          akClone.style.cssText = "width:210mm;min-height:297mm;padding:20mm 15mm;box-sizing:border-box;page-break-before:always;background:#fff";
          container.appendChild(akClone);
        }
      }

      await html2pdf().set({
        margin: 0,
        filename: `${config.tema || "jogo"}-${selectedGame}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, width: 794, windowWidth: 794, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], avoid: ["table", "svg", ".no-break"] },
      }).from(container).save();
      toast.success("PDF exportado!");
    } catch { toast.error("Erro ao exportar PDF"); }
  };

  // --- Save ---
  const handleSave = async () => {
    if (!user) { toast.error("Faça login para salvar"); return; }
    if (!gameData) return;
    if (!docLimits.checkAndWarnLimit()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("documentos_salvos").insert({
        user_id: user.id, tipo: "jogo",
        titulo: `${gameDef?.title}: ${config.tema || "Sem tema"}`,
        conteudo: { gameType: selectedGame, gameData, config: toGameConfig(config) } as any,
        disciplina: config.header.disciplina || null, nivel: config.difficulty,
      });
      if (error) throw error;
      toast.success("Salvo na biblioteca!");
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  };

  // --- Render preview ---
  const renderPreview = () => {
    if (!gameData || !selectedGame) return null;
    const gc = toGameConfig(config);
    const map: Record<string, React.ReactNode> = {
      "caca-palavras": <WordSearchPreview data={gameData} config={gc} />,
      "cruzadinha": <CrosswordPreview data={gameData} config={gc} />,
      "criptograma": <CryptogramPreview data={gameData} config={gc} />,
      "sudoku": <SudokuPreview data={gameData} config={gc} />,
      "labirinto": <MazePreview data={gameData} config={gc} />,
    };
    return map[selectedGame] || null;
  };

  // --- Game selector screen ---
  if (!selectedGame) {
    return <GameSelector onSelect={handleSelectGame} />;
  }

  // --- Editor screen ---
  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Jogos
          </Button>
          <h1 className="font-display text-lg font-bold flex items-center gap-2">
            {gameDef && <gameDef.icon className="h-5 w-5 text-primary" />}
            {gameDef?.title}
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
          </div>
        )}
      </div>

      <div className="flex gap-4 items-start" style={{ minHeight: "calc(100vh - 180px)" }}>
        {/* LEFT: Config */}
        <div className="w-[340px] shrink-0 sticky top-4 overflow-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
          <GameConfigPanel
            gameDef={gameDef!}
            gameId={selectedGame}
            config={config}
            onChange={updateConfig}
            onGenerate={handleGenerate}
            onRegenerate={handleRegenerate}
            onToggleAnswerKey={() => setShowAnswerKey(v => !v)}
            generating={generating}
            hasData={!!gameData}
            showAnswerKey={showAnswerKey}
            saving={saving}
            onSave={handleSave}
          />
        </div>

        {/* RIGHT: Preview */}
        <div className="flex-1 min-w-0 overflow-x-hidden">
          <ResponsiveA4Wrapper>
            <div className="bg-muted/30 rounded-lg p-2 sm:p-4 flex flex-col items-center gap-6">
              {gameData ? (
                <>
                  <div className="shadow-elevated">{renderPreview()}</div>
                  {config.answerKey !== "none" && showAnswerKey && (
                    <div className="shadow-elevated">
                      <AnswerKeyPreview gameType={selectedGame!} gameData={gameData} config={toGameConfig(config)} />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Gamepad2 className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">
                    {config.mode === "ai" ? "Insira o tema e clique em \"Gerar com IA\"" : "Configure e clique em \"Gerar Jogo\""}
                  </p>
                  <p className="text-xs mt-1">O preview A4 aparecerá aqui</p>
                </div>
              )}
            </div>
          </ResponsiveA4Wrapper>
        </div>
      </div>
    </div>
  );
}
