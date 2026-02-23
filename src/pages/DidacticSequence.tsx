import { Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DidacticSequence() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" /> Sequência Didática
        </h1>
        <p className="text-muted-foreground mt-1">Planeje sequências integradas de vários dias letivos</p>
      </div>
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-lg">Nova Sequência</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Tema</Label><Input placeholder="Ex: Meio Ambiente, Alimentação Saudável" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Duração</Label>
              <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 dias</SelectItem>
                  <SelectItem value="5">5 dias</SelectItem>
                  <SelectItem value="10">10 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Série</Label>
              <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["1º ano","2º ano","3º ano","4º ano","5º ano","6º ano","7º ano","8º ano","9º ano"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button size="lg" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90">
            <Sparkles className="mr-2 h-5 w-5" /> Gerar Sequência
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
