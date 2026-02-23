import { FileText, Plus, Image, Sparkles, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function Activities() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Atividades A4
        </h1>
        <p className="text-muted-foreground mt-1">Crie atividades com layout profissional para impressão</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-lg">Editor</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea placeholder="Cole ou digite o texto da atividade aqui..." className="min-h-[200px]" />
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm"><Plus className="mr-1 h-4 w-4" /> Bloco de Texto</Button>
              <Button variant="outline" size="sm"><Plus className="mr-1 h-4 w-4" /> Questão</Button>
              <Button variant="outline" size="sm"><Image className="mr-1 h-4 w-4" /> Imagem</Button>
              <Button size="sm" className="gradient-primary border-0 text-primary-foreground hover:opacity-90"><Sparkles className="mr-1 h-4 w-4" /> Gerar com IA</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Preview A4</CardTitle>
            <Button variant="outline" size="sm"><FileDown className="mr-1 h-4 w-4" /> PDF</Button>
          </CardHeader>
          <CardContent>
            <div className="aspect-[210/297] rounded-lg border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Preview da atividade aparecerá aqui</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
