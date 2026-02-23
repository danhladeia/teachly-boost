import { Presentation, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SlidesGenerator() {
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
            <Input placeholder="Ex: Sistema Solar, Revolução Industrial" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Série</Label>
              <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["1º ano","2º ano","3º ano","4º ano","5º ano","6º ano","7º ano","8º ano","9º ano"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <Select><SelectTrigger><SelectValue placeholder="Escolha o estilo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderno">Moderno</SelectItem>
                  <SelectItem value="kids">Kids</SelectItem>
                  <SelectItem value="cientifico">Científico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button size="lg" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90">
            <Sparkles className="mr-2 h-5 w-5" /> Gerar Slides
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
