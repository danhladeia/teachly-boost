import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold">Pedagox</span>
          </Link>
          <CardTitle className="font-display text-xl">Entrar na sua conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <Button size="lg" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90">Entrar</Button>
          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">Criar conta grátis</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
