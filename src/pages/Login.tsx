import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ShieldCheck, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoGoPedagoX from "@/assets/logo-gopedagox.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRoleChoice, setShowRoleChoice] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email ou senha incorretos" : error.message);
      return;
    }

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("support_admins").select("id").eq("user_id", user.id).maybeSingle();
      if (data) {
        setIsAdminUser(true);
        setShowRoleChoice(true);
        return;
      }
    }
    navigate("/app");
  };

  if (showRoleChoice && isAdminUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="text-center">
            <Link to="/" className="inline-flex items-center justify-center mb-4">
              <img src={logoGoPedagoX} alt="GoPedagoX" className="h-20 w-auto" />
            </Link>
            <CardTitle className="font-display text-xl">Como deseja acessar?</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Escolha o modo de acesso</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              size="lg"
              className="w-full h-16 text-base gradient-primary border-0 text-primary-foreground hover:opacity-90"
              onClick={() => navigate("/app")}
            >
              <User className="h-5 w-5 mr-3" />
              Acessar como Usuário
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full h-16 text-base border-2 border-primary text-primary hover:bg-primary/10"
              onClick={() => navigate("/admin")}
            >
              <ShieldCheck className="h-5 w-5 mr-3" />
              Acessar como Administrador
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center">
          <Link to="/" className="inline-flex items-center justify-center mb-4">
            <img src={logoGoPedagoX} alt="GoPedagoX" className="h-20 w-auto" />
          </Link>
          <CardTitle className="font-display text-xl">Entrar na sua conta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <Input className="pl-10" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">Criar conta grátis</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
