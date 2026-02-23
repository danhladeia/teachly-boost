import { Settings, User, CreditCard, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AppSettings() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Configurações
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie sua conta e preferências</p>
      </div>
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><User className="h-5 w-5" /> Perfil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Nome</Label><Input placeholder="Seu nome" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="email@escola.com" /></div>
          </div>
          <div className="space-y-2"><Label>Escola</Label><Input placeholder="Nome da escola" /></div>
          <Button className="gradient-primary border-0 text-primary-foreground hover:opacity-90">Salvar alterações</Button>
        </CardContent>
      </Card>
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><CreditCard className="h-5 w-5" /> Plano Atual</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Plano Gratuito</p>
              <p className="text-sm text-muted-foreground">10 planos/mês • 5 atividades/mês</p>
            </div>
            <Button variant="outline">Fazer upgrade</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
