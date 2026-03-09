import React from "react";
import { Sparkles, Upload, Loader2, Image as ImageIcon, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { niveis, estilosImagem, type SlideTemplate, type SlideDensity } from "./types";
import TimbreSelector from "@/components/TimbreSelector";
import type { TimbreData } from "@/hooks/useTimbre";

interface Props {
  tema: string; setTema: (v: string) => void;
  descricao: string; setDescricao: (v: string) => void;
  textoBase: string; setTextoBase: (v: string) => void;
  nivel: string; setNivel: (v: string) => void;
  serie: string; setSerie: (v: string) => void;
  template: SlideTemplate; setTemplate: (v: SlideTemplate) => void;
  numSlides: number; setNumSlides: (v: number) => void;
  densidade: SlideDensity; setDensidade: (v: SlideDensity) => void;
  estiloImagem: string; setEstiloImagem: (v: string) => void;
  gerarImagens: boolean; setGerarImagens: (v: boolean) => void;
  loading: boolean;
  onGenerate: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  arquivo: File | null;
  // Timbre props (optional for backwards compatibility)
  selectedTimbre?: TimbreData | null;
  onTimbreSelect?: (t: TimbreData | null) => void;
  professor?: string;
  setProfessor?: (v: string) => void;
}

export default function SlideConfigPanel({
  tema, setTema, descricao, setDescricao, textoBase, setTextoBase,
  nivel, setNivel, serie, setSerie, template, setTemplate,
  numSlides, setNumSlides, densidade, setDensidade,
  estiloImagem, setEstiloImagem, gerarImagens, setGerarImagens,
  loading, onGenerate, onFileUpload, arquivo,
  selectedTimbre, onTimbreSelect, professor, setProfessor,
}: Props) {
  return (
    <div className="space-y-4">
      {/* TIMBRE - Primeiro */}
      {onTimbreSelect && (
        <Card className="shadow-card">
          <CardContent className="pt-4 space-y-3">
            <h3 className="text-xs font-semibold flex items-center gap-1"><Building2 className="h-3 w-3" /> Cabeçalho dos Slides</h3>
            <TimbreSelector
              selectedId={selectedTimbre?.id}
              onSelect={onTimbreSelect}
              label="Escola/Instituição"
            />
            {setProfessor && (
              <div className="space-y-1">
                <Label className="text-[10px]">Professor(a)</Label>
                <Input placeholder="Nome do professor" value={professor || ""} onChange={e => setProfessor(e.target.value)} className="h-8 text-xs" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">Nova apresentação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema da aula *</Label>
            <Input placeholder="Ex: Sistema Solar, Revolução Industrial" value={tema} onChange={e => setTema(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Instruções adicionais</Label>
            <Textarea placeholder="Ex: Foque nos planetas gasosos, inclua dados curiosos..." value={descricao} onChange={e => setDescricao(e.target.value)} className="min-h-[60px]" />
          </div>

          <div className="space-y-2">
            <Label>Texto base <span className="text-muted-foreground text-xs">(opcional — cole seu conteúdo)</span></Label>
            <Textarea placeholder="Cole aqui o texto do livro, apostila ou anotações que a IA deve usar como base..." value={textoBase} onChange={e => setTextoBase(e.target.value)} className="min-h-[80px]" />
          </div>

          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nível</Label>
              <Select value={nivel} onValueChange={v => { setNivel(v); setSerie(""); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{Object.keys(niveis).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Série</Label>
              <Select value={serie} onValueChange={setSerie} disabled={!nivel}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Série" /></SelectTrigger>
                <SelectContent>{(niveis[nivel] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Template</Label>
              <Select value={template} onValueChange={v => setTemplate(v as SlideTemplate)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderno">Moderno</SelectItem>
                  <SelectItem value="kids">Kids</SelectItem>
                  <SelectItem value="cientifico">Científico</SelectItem>
                  <SelectItem value="tech">Tecnológico</SelectItem>
                  <SelectItem value="minimal">Minimalista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Qtd slides</Label>
              <Input type="number" min={3} max={30} value={numSlides === 0 ? "" : numSlides} onChange={e => setNumSlides(e.target.value === "" ? 0 : Math.max(3, Math.min(30, parseInt(e.target.value))))} onBlur={() => { if (numSlides === 0) setNumSlides(8); }} className="h-9" />
            </div>
          </div>

          {/* Density */}
          <div className="space-y-1.5">
            <Label className="text-xs">Densidade do conteúdo</Label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setDensidade("visual")} className={`rounded-lg border-2 p-2.5 text-left transition-colors text-xs ${densidade === "visual" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}>
                <span className="font-medium">🎨 Visual</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">Pouco texto, foco em imagens</p>
              </button>
              <button onClick={() => setDensidade("informativo")} className={`rounded-lg border-2 p-2.5 text-left transition-colors text-xs ${densidade === "informativo" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}>
                <span className="font-medium">📝 Informativo</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">Mais texto para estudo</p>
              </button>
            </div>
          </div>

          {/* Image generation toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Switch checked={gerarImagens} onCheckedChange={setGerarImagens} id="img-toggle" />
              <Label htmlFor="img-toggle" className="text-xs flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" /> Gerar imagens por IA
              </Label>
            </div>
            {!gerarImagens && (
              <p className="text-[10px] text-muted-foreground ml-8">Slides serão gerados apenas com texto. Você pode adicionar imagens manualmente depois.</p>
            )}
          </div>

          {/* Image style - only when generating images */}
          {gerarImagens && (
            <div className="space-y-1.5">
              <Label className="text-xs">Estilo das imagens IA</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {estilosImagem.map(e => (
                  <button key={e.value} onClick={() => setEstiloImagem(e.value)} className={`rounded-md border p-1.5 text-left transition-colors ${estiloImagem === e.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}>
                    <span className="text-[11px] font-medium block truncate">{e.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* File upload */}
          <div className="space-y-1.5">
            <Label className="text-xs">Arquivo base <span className="text-muted-foreground">(opcional)</span></Label>
            <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border px-3 py-2 hover:bg-muted/50 transition-colors">
              <Upload className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">{arquivo ? arquivo.name : "PDF, DOCX ou TXT"}</span>
              <input type="file" accept=".pdf,.docx,.txt,.doc" className="hidden" onChange={onFileUpload} />
            </label>
          </div>

          <Button size="lg" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90" disabled={loading || !tema.trim()} onClick={onGenerate}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar Slides</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
