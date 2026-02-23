import { FileCheck, Plus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Exams() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <FileCheck className="h-6 w-6 text-primary" /> Provas e Correção
        </h1>
        <p className="text-muted-foreground mt-1">Crie provas e corrija por foto com inteligência artificial</p>
      </div>
      <Tabs defaultValue="criar">
        <TabsList><TabsTrigger value="criar">Criar Prova</TabsTrigger><TabsTrigger value="corrigir">Corrigir por Foto</TabsTrigger></TabsList>
        <TabsContent value="criar">
          <Card className="shadow-card mt-4">
            <CardHeader><CardTitle className="font-display text-lg">Nova Prova</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Título</Label><Input placeholder="Prova de Ciências - 4º ano" /></div>
                <div className="space-y-2"><Label>Nº de questões</Label><Input type="number" placeholder="10" /></div>
              </div>
              <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Adicionar Questão</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="corrigir">
          <Card className="shadow-card mt-4">
            <CardHeader><CardTitle className="font-display text-lg">Correção por Foto</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-10 w-10 text-primary" />
              </div>
              <p className="text-muted-foreground text-center max-w-sm">Aponte a câmera para a folha de respostas preenchida pelo aluno</p>
              <Button className="gradient-primary border-0 text-primary-foreground hover:opacity-90"><Camera className="mr-2 h-4 w-4" /> Abrir Câmera</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
