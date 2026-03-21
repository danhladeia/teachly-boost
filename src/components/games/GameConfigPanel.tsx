import { useState } from "react";
import { Wand2, Edit3, Zap, Settings2, HelpCircle, ChevronDown, ChevronUp, Loader2, Sparkles, RotateCcw, Eye, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import TimbreSelector from "@/components/TimbreSelector";
import type { TimbreData } from "@/hooks/useTimbre";
import type { GameDef } from "./GameSelector";
import {
  etapaConfig, getWordSearchDefaults,
  type Difficulty, type EtapaEscolar, type GameConfig, type GameHeader,
  type GridSize, type CryptoSymbolTheme, type CryptoCipherType,
  type WordSearchDirections, type AnswerKeyMode, defaultHeader, defaultDirections,
} from "./types";

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

export interface GameConfigState {
  tema: string;
  palavras: string;
  difficulty: Difficulty;
  etapa: EtapaEscolar;
  header: GameHeader;
  answerKey: AnswerKeyMode;
  mode: "ai" | "manual";
  editorMode: "quick" | "advanced";
  customInstructions: string;
  // Word Search
  gridSize: GridSize;
  directions: WordSearchDirections;
  wordListPosition: string;
  letterCase: string;
  cellFormat: string;
  wordListOrder: string;
  spacing: number;
  miniText: boolean;
  // Crossword
  hintStyle: string;
  crosswordSymmetry: string;
  mysteryWord: string;
  // Cryptogram
  symbolTheme: CryptoSymbolTheme;
  cipherType: CryptoCipherType;
  caesarShift: number;
  vigenereKey: string;
  showCipherTable: string;
  // Sudoku
  sudokuSize: 4 | 6 | 9;
  sudokuContentType: string;
  sudokuCustomSymbols: string;
  sudokuFillPercent: number;
  sudokuCount: number;
  sudokuShowScratch: boolean;
  // Maze
  mazeSize: string;
}

export function getDefaultConfig(): GameConfigState {
  return {
    tema: "", palavras: "", difficulty: "facil", etapa: "finais",
    header: { ...defaultHeader }, answerKey: "separate",
    mode: "ai", editorMode: "quick", customInstructions: "",
    gridSize: "10x10", directions: { ...defaultDirections },
    wordListPosition: "below", letterCase: "upper", cellFormat: "square",
    wordListOrder: "alphabetical", spacing: 1, miniText: false,
    hintStyle: "text", crosswordSymmetry: "symmetric", mysteryWord: "",
    symbolTheme: "random", cipherType: "numeric", caesarShift: 3, vigenereKey: "",
    showCipherTable: "full",
    sudokuSize: 4, sudokuContentType: "numbers", sudokuCustomSymbols: "",
    sudokuFillPercent: 60, sudokuCount: 4, sudokuShowScratch: false,
    mazeSize: "medium",
  };
}

export function toGameConfig(s: GameConfigState): GameConfig {
  return {
    tema: s.tema, palavras: s.palavras, difficulty: s.difficulty, etapa: s.etapa,
    header: s.header, colorMode: "color", answerKey: s.answerKey,
    customInstructions: s.customInstructions || undefined,
    gridSize: s.gridSize, directions: s.directions,
    wordListPosition: s.wordListPosition as any, wordListOrder: s.wordListOrder as any,
    cellFormat: s.cellFormat as any, letterCase: s.letterCase as any,
    fontStyle: "print", spacing: s.spacing, miniText: s.miniText,
    hideWordList: s.wordListPosition === "hidden",
    hintStyle: s.hintStyle as any, crosswordSymmetry: s.crosswordSymmetry as any,
    mysteryWord: s.mysteryWord || undefined,
    symbolTheme: s.symbolTheme, cipherType: s.cipherType,
    caesarShift: s.caesarShift, vigenereKey: s.vigenereKey || undefined,
    showCipherTable: s.showCipherTable as any,
    sudokuSize: s.sudokuSize, sudokuContentType: s.sudokuContentType as any,
    sudokuCustomSymbols: s.sudokuCustomSymbols ? s.sudokuCustomSymbols.split(",").map(x => x.trim()).filter(Boolean) : undefined,
    sudokuFillPercent: s.sudokuFillPercent, sudokuCount: s.sudokuCount, sudokuShowScratch: s.sudokuShowScratch,
    mazeSize: s.mazeSize as any, mazeStyle: "square",
  };
}

interface Props {
  gameDef: GameDef;
  gameId: string;
  config: GameConfigState;
  onChange: (partial: Partial<GameConfigState>) => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  onToggleAnswerKey: () => void;
  generating: boolean;
  hasData: boolean;
  showAnswerKey: boolean;
  saving: boolean;
  onSave: () => void;
}

export default function GameConfigPanel({
  gameDef, gameId, config, onChange, onGenerate, onRegenerate,
  onToggleAnswerKey, generating, hasData, showAnswerKey, saving, onSave,
}: Props) {
  const isAdvanced = config.editorMode === "advanced";

  const applyEtapaDefaults = (e: EtapaEscolar, d: Difficulty) => {
    const defs = getWordSearchDefaults(e, d);
    onChange({ gridSize: defs.gridSize, directions: defs.directions });
  };

  return (
    <Card className="shadow-card">
      <CardContent className="p-3 space-y-3">
        {/* Cabeçalho Institucional */}
        <div className="rounded-lg border border-dashed border-primary/30 p-3 space-y-3 bg-primary/5">
          <Label className="text-xs font-semibold">🏫 Cabeçalho Institucional</Label>
          <TimbreSelector
            selectedId={undefined}
            onSelect={(t: TimbreData | null) => {
              if (t) onChange({ header: { ...config.header, escola: t.escola || config.header.escola, logoUrl: t.logoUrl || config.header.logoUrl, bannerUrl: t.bannerUrl || config.header.bannerUrl } });
            }}
            label="Selecionar escola/timbre"
          />
          <Input placeholder="Ou digite o nome da escola" value={config.header.escola} onChange={e => onChange({ header: { ...config.header, escola: e.target.value } })} className="h-7 text-[9px]" />
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Professor(a)</Label>
              <Input placeholder="Nome" value={config.header.professor} onChange={e => onChange({ header: { ...config.header, professor: e.target.value } })} className="h-7 text-[9px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Turma</Label>
              <Input placeholder="Ex: 5ºA" value={config.header.serie} onChange={e => onChange({ header: { ...config.header, serie: e.target.value } })} className="h-7 text-[9px]" />
            </div>
          </div>
        </div>

        {/* Quick/Advanced */}
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold flex items-center gap-1">
            {isAdvanced ? <Settings2 className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
            Modo {isAdvanced ? "Avançado" : "Rápido"}
          </Label>
          <Switch checked={isAdvanced} onCheckedChange={v => onChange({ editorMode: v ? "advanced" : "quick" })} />
        </div>

        {/* Etapa Escolar */}
        <Section title="📚 Etapa Escolar">
          <div className="grid grid-cols-3 gap-1">
            {(Object.entries(etapaConfig) as [EtapaEscolar, typeof etapaConfig.iniciais][]).map(([key, cfg]) => (
              <button key={key} onClick={() => { onChange({ etapa: key }); applyEtapaDefaults(key, config.difficulty); }}
                className={`rounded-md border p-2 text-center transition-all ${config.etapa === key ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/40"}`}>
                <span className="text-base">{cfg.icon}</span>
                <p className="text-[9px] font-medium mt-0.5 leading-tight">{cfg.label}</p>
                <p className="text-[8px] text-muted-foreground">{cfg.desc}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* Dificuldade */}
        <Section title="🎯 Nível de Dificuldade">
          <div className="grid grid-cols-3 gap-1">
            {(["facil", "medio", "dificil"] as Difficulty[]).map(d => (
              <button key={d} onClick={() => { onChange({ difficulty: d }); applyEtapaDefaults(config.etapa, d); }}
                className={`rounded-md border p-2 text-center transition-all text-[10px] font-medium ${config.difficulty === d ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/40"}`}>
                {d === "facil" ? "Fácil" : d === "medio" ? "Médio" : "Difícil"}
              </button>
            ))}
          </div>
        </Section>

        {/* Modo IA / Manual */}
        {gameDef.supportsAI && (
          <Section title="⚡ Modo de Geração">
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => onChange({ mode: "ai" })} className={`flex items-center justify-center gap-1.5 rounded-md border p-2 text-[10px] font-medium transition-all ${config.mode === "ai" ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border hover:border-muted-foreground/40"}`}>
                <Wand2 className="h-3 w-3" /> Gerar com IA
              </button>
              <button onClick={() => onChange({ mode: "manual" })} className={`flex items-center justify-center gap-1.5 rounded-md border p-2 text-[10px] font-medium transition-all ${config.mode === "manual" ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border hover:border-muted-foreground/40"}`}>
                <Edit3 className="h-3 w-3" /> Manual
              </button>
            </div>
          </Section>
        )}

        {/* Tema */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Tema <Tip text="O tema será usado pela IA ou como título" /></Label>
          <Input placeholder="Ex: Adjetivos, Frações, Sistema Solar..." value={config.tema} onChange={e => onChange({ tema: e.target.value })} className="h-8 text-xs" />
        </div>

        {/* Palavras (word-based games) */}
        {gameDef.needsWords && (config.mode === "manual" || config.palavras.trim()) && (
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Palavras-chave (vírgula)</Label>
            <Textarea placeholder="SUJEITO, VERBO, PREDICADO" value={config.palavras} onChange={e => onChange({ palavras: e.target.value })} className="min-h-[50px] text-xs" />
          </div>
        )}

        {/* === GAME SPECIFIC === */}

        {/* CAÇA-PALAVRAS */}
        {gameId === "caca-palavras" && (
          <Section title="🔍 Configurações do Caça-Palavras">
            <div className="space-y-1">
              <Label className="text-[10px]">Tamanho da Grade</Label>
              <Select value={config.gridSize} onValueChange={v => onChange({ gridSize: v as GridSize })}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["8x8","10x10","12x12","15x15","18x18","20x20"].map(s => <SelectItem key={s} value={s}>{s.replace("x","×")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Direções permitidas</Label>
              {([
                { key: "horizontal" as const, label: "➡️ Horizontal" },
                { key: "vertical" as const, label: "⬇️ Vertical" },
                { key: "diagonalDown" as const, label: "↘️ Diagonal" },
                { key: "diagonalUp" as const, label: "↗️ Diagonal reversa" },
                { key: "reversed" as const, label: "🔄 Invertidas" },
              ]).map(d => (
                <div key={d.key} className="flex items-center gap-2">
                  <Checkbox id={`dir-${d.key}`} checked={config.directions[d.key]}
                    onCheckedChange={v => onChange({ directions: { ...config.directions, [d.key]: !!v } })} />
                  <label htmlFor={`dir-${d.key}`} className="text-[10px]">{d.label}</label>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Lista de palavras</Label>
              <Select value={config.wordListPosition} onValueChange={v => onChange({ wordListPosition: v })}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="below">Abaixo</SelectItem>
                  <SelectItem value="side">Ao lado</SelectItem>
                  <SelectItem value="above">Acima</SelectItem>
                  <SelectItem value="hidden">Ocultar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">📖 Gerar minitexto</Label>
              <Switch checked={config.miniText} onCheckedChange={v => onChange({ miniText: v })} />
            </div>
            {isAdvanced && (
              <>
                <div className="space-y-1">
                  <Label className="text-[10px]">Tipo de letra</Label>
                  <Select value={config.letterCase} onValueChange={v => onChange({ letterCase: v })}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upper">MAIÚSCULAS</SelectItem>
                      <SelectItem value="lower">minúsculas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Formato das células</Label>
                  <Select value={config.cellFormat} onValueChange={v => onChange({ cellFormat: v })}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Quadrado</SelectItem>
                      <SelectItem value="circle">Círculo</SelectItem>
                      <SelectItem value="none">Sem fundo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Espaçamento ({config.spacing.toFixed(1)}x)</Label>
                  <Slider value={[config.spacing]} onValueChange={v => onChange({ spacing: v[0] })} min={0.8} max={1.5} step={0.1} />
                </div>
              </>
            )}
          </Section>
        )}

        {/* CRUZADINHA */}
        {gameId === "cruzadinha" && (
          <Section title="✏️ Configurações das Cruzadas">
            <div className="space-y-1">
              <Label className="text-[10px]">Estilo de Dica</Label>
              <Select value={config.hintStyle} onValueChange={v => onChange({ hintStyle: v })}>
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
              <div className="space-y-1">
                <Label className="text-[10px]">Palavra misteriosa (opcional)</Label>
                <Input placeholder="Palavra na vertical" value={config.mysteryWord} onChange={e => onChange({ mysteryWord: e.target.value })} className="h-7 text-[10px]" />
              </div>
            )}
          </Section>
        )}

        {/* CRIPTOGRAMA */}
        {gameId === "criptograma" && (
          <Section title="🔐 Configurações do Criptograma">
            <div className="space-y-1">
              <Label className="text-[10px]">Tipo de cifra</Label>
              <Select value={config.cipherType} onValueChange={v => onChange({ cipherType: v as CryptoCipherType })}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="numeric">Numérica (A=1)</SelectItem>
                  <SelectItem value="substitution">Substituição</SelectItem>
                  <SelectItem value="caesar">Cifra de César</SelectItem>
                  <SelectItem value="math">Equações</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.cipherType === "caesar" && (
              <div className="space-y-1">
                <Label className="text-[10px]">Deslocamento ({config.caesarShift})</Label>
                <Slider value={[config.caesarShift]} onValueChange={v => onChange({ caesarShift: v[0] })} min={1} max={25} step={1} />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-[10px]">Tema dos símbolos</Label>
              <Select value={config.symbolTheme} onValueChange={v => onChange({ symbolTheme: v as CryptoSymbolTheme })}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Números (1-26)</SelectItem>
                  <SelectItem value="math">Matemático (∑, ∆, π)</SelectItem>
                  <SelectItem value="emoji">Emojis (★, ♥)</SelectItem>
                  <SelectItem value="geometric">Geométrico (▲, ●)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isAdvanced && (
              <div className="space-y-1">
                <Label className="text-[10px]">Exibição da tabela</Label>
                <Select value={config.showCipherTable} onValueChange={v => onChange({ showCipherTable: v })}>
                  <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Completa</SelectItem>
                    <SelectItem value="partial">Parcial</SelectItem>
                    <SelectItem value="hidden">Ocultar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </Section>
        )}

        {/* SUDOKU */}
        {gameId === "sudoku" && (
          <Section title="🧩 Configurações do Sudoku">
            <div className="space-y-1">
              <Label className="text-[10px]">Tamanho da grade</Label>
              <Select value={String(config.sudokuSize)} onValueChange={v => onChange({ sudokuSize: Number(v) as 4 | 6 | 9 })}>
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
              <Select value={config.sudokuContentType} onValueChange={v => onChange({ sudokuContentType: v })}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="numbers">Números</SelectItem>
                  <SelectItem value="shapes">Formas</SelectItem>
                  <SelectItem value="letters">Letras</SelectItem>
                  <SelectItem value="emojis">Emojis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isAdvanced && (
              <>
                <div className="space-y-1">
                  <Label className="text-[10px]">% preenchido ({config.sudokuFillPercent}%)</Label>
                  <Slider value={[config.sudokuFillPercent]} onValueChange={v => onChange({ sudokuFillPercent: v[0] })} min={20} max={80} step={5} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Puzzles por página ({config.sudokuCount})</Label>
                  <Slider value={[config.sudokuCount]} onValueChange={v => onChange({ sudokuCount: v[0] })} min={1} max={4} step={1} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[10px]">Espaço para rascunho</Label>
                  <Switch checked={config.sudokuShowScratch} onCheckedChange={v => onChange({ sudokuShowScratch: v })} />
                </div>
              </>
            )}
          </Section>
        )}

        {/* LABIRINTO */}
        {gameId === "labirinto" && (
          <Section title="🏁 Configurações do Labirinto">
            <div className="space-y-1">
              <Label className="text-[10px]">Tamanho</Label>
              <Select value={config.mazeSize} onValueChange={v => onChange({ mazeSize: v })}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>
        )}

        {/* Gabarito */}
        <Section title="📋 Gabarito">
          <Select value={config.answerKey} onValueChange={v => onChange({ answerKey: v as AnswerKeyMode })}>
            <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="separate">Folha separada</SelectItem>
              <SelectItem value="none">Não incluir</SelectItem>
            </SelectContent>
          </Select>
        </Section>

        {/* Generate */}
        <div className="flex flex-col gap-2 pt-2 border-t">
          <Button onClick={onGenerate} disabled={generating} className="gradient-primary border-0 text-primary-foreground hover:opacity-90 h-9 text-xs">
            {generating ? (
              <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Gerando...</>
            ) : config.mode === "ai" && gameDef.supportsAI ? (
              <><Wand2 className="mr-1 h-3 w-3" /> Gerar com IA</>
            ) : (
              <><Sparkles className="mr-1 h-3 w-3" /> Gerar Jogo</>
            )}
          </Button>
          {hasData && (
            <div className="grid grid-cols-2 gap-1.5">
              <Button variant="outline" size="sm" onClick={onRegenerate} className="h-7 text-[10px]">
                <RotateCcw className="h-3 w-3 mr-1" /> Novo Layout
              </Button>
              {config.answerKey !== "none" && (
                <Button variant="outline" size="sm" onClick={onToggleAnswerKey} className="h-7 text-[10px]">
                  <Eye className="h-3 w-3 mr-1" /> {showAnswerKey ? "Ocultar" : "Ver"} Gabarito
                </Button>
              )}
            </div>
          )}
          {hasData && (
            <Button variant="outline" size="sm" onClick={onSave} disabled={saving} className="h-7 text-[10px]">
              <Save className="h-3 w-3 mr-1" /> {saving ? "Salvando..." : "Salvar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
