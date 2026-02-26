import { useState } from "react";
import { Presentation, Sparkles, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const niveis: Record<string, string[]> = {
  "Fundamental - Séries Iniciais": ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano"],
  "Fundamental - Séries Finais": ["6º ano", "7º ano", "8º ano", "9º ano"],
  "Ensino Médio": ["1ª série", "2ª série", "3ª série"],
};

export default function SlidesGenerator() {
  const [tema, setTema] = useState("");
  const [descricao, setDescricao] = useState("");
  const [nivel, setNivel] = useState("");
  const [serie, setSerie] = useState("");
  const [template, setTemplate] = useState("");
  const [numSlides, setNumSlides] = useState(8);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setArquivo(file);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Presentation className="h-6 w-6 text-primary" /> Gerador de Slides
        </h1>
        <p className="text-muted-foreground mt-1">Crie apresentações prontas para projetar na sala de aula</p>
      </div>
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-lg">Nova apresentação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema da aula</Label>
            <Input placeholder="Ex: Sistema Solar, Revolução Industrial" value={tema} onChange={e => setTema(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Descreva o que deseja nos slides</Label>
            <Textarea
              placeholder="Ex: Quero slides com imagens do sistema solar, explicando cada planeta com dados curiosos para crianças..."
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Nível de ensino</Label>
              <Select value={nivel} onValueChange={v => { setNivel(v); setSerie(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(niveis).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Série / Ano</Label>
              <Select value={serie} onValueChange={setSerie} disabled={!nivel}>
                <SelectTrigger><SelectValue placeholder="Série" /></SelectTrigger>
                <SelectContent>
                  {(niveis[nivel] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger><SelectValue placeholder="Estilo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderno">Moderno</SelectItem>
                  <SelectItem value="kids">Kids</SelectItem>
                  <SelectItem value="cientifico">Científico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Quantidade de slides</Label>
              <Input type="number" min={3} max={30} value={numSlides} onChange={e => setNumSlides(Math.max(3, Math.min(30, parseInt(e.target.value) || 8)))} />
            </div>
            <div className="space-y-2">
              <Label>Arquivo base <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border px-3 py-2.5 hover:bg-muted/50 transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate">{arquivo ? arquivo.name : "PDF, DOCX ou TXT"}</span>
                <input type="file" accept=".pdf,.docx,.txt,.doc" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          <Button size="lg" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90" disabled={loading || !tema.trim()}>
            {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando...</> : <><Sparkles className="mr-2 h-5 w-5" /> Gerar {numSlides} Slides</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
