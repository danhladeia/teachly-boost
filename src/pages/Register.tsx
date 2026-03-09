import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import logoGoPedagoX from "@/assets/logo-gopedagox.png";

export default function Register() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) { toast.error("Você precisa aceitar os Termos de Uso e Política de Privacidade"); return; }
    if (password.length < 6) { toast.error("Senha deve ter no mínimo 6 caracteres"); return; }
    setLoading(true);
    const { error } = await signUp(email, password, nome);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Conta criada com sucesso!");
      navigate("/app");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center">
          <Link to="/" className="inline-flex items-center justify-center mb-4">
            <img src={logoGoPedagoX} alt="GoPedagoX" className="h-20 w-auto" />
          </Link>
          <CardTitle className="font-display text-xl">Criar sua conta</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">5 créditos grátis • Sem cartão de crédito</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="Seu nome completo" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                Ao criar uma conta, você concorda com nossos{" "}
                <Link to="/termos" className="text-primary font-medium hover:underline" target="_blank">Termos de Uso</Link>{" "}
                e{" "}
                <Link to="/privacidade" className="text-primary font-medium hover:underline" target="_blank">Política de Privacidade</Link>.
              </label>
            </div>
            <Button type="submit" size="lg" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90" disabled={loading || !acceptedTerms}>
              {loading ? "Criando..." : "Criar conta grátis"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
