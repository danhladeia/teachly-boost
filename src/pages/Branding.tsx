import { Stamp, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Branding() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Stamp className="h-6 w-6 text-primary" /> Timbres e Branding
        </h1>
        <p className="text-muted-foreground mt-1">Configure a identidade visual dos seus materiais</p>
      </div>
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-lg">Timbre da Escola</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Nome da Escola</Label><Input placeholder="Ex: E.M. Paulo Freire" /></div>
          <div className="space-y-2">
            <Label>Logo da escola</Label>
            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
              <div className="text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Clique para enviar (PNG, JPG - max 2MB)</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Preview do cabeçalho (190x30mm)</Label>
            <div className="h-20 rounded-lg border bg-card flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Preview aparecerá aqui</p>
            </div>
          </div>
          <Button className="gradient-primary border-0 text-primary-foreground hover:opacity-90"><Save className="mr-2 h-4 w-4" /> Salvar Timbre</Button>
        </CardContent>
      </Card>
    </div>
  );
}
