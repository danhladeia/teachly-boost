import { BookOpen, FileText, Gamepad2, Presentation, FileCheck, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Planos criados", value: "0", icon: BookOpen, color: "text-primary" },
  { label: "Atividades geradas", value: "0", icon: FileText, color: "text-accent-foreground" },
  { label: "Jogos criados", value: "0", icon: Gamepad2, color: "text-plan-pratico" },
  { label: "Slides gerados", value: "0", icon: Presentation, color: "text-plan-mestre" },
  { label: "Provas corrigidas", value: "0", icon: FileCheck, color: "text-destructive" },
  { label: "Horas economizadas", value: "0h", icon: TrendingUp, color: "text-primary" },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu planejamento pedagógico</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Comece aqui</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Bem-vindo ao Pedagox! Comece criando seu primeiro plano de aula no{" "}
            <a href="/app/bncc" className="text-primary font-medium hover:underline">Planejador BNCC</a>{" "}
            ou explore a{" "}
            <a href="/app/jogos" className="text-primary font-medium hover:underline">Fábrica de Jogos</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
