import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CreditsProvider } from "@/hooks/useCredits";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import LibraryPage from "./pages/Library";
import BNCCPlanner from "./pages/BNCCPlanner";
import Activities from "./pages/Activities";
import SlidesGenerator from "./pages/SlidesGenerator";
import GameFactory from "./pages/GameFactory";
import Exams from "./pages/Exams";
import DiagramGenerator from "./pages/DiagramGenerator";
import Pricing from "./pages/Pricing";
import Branding from "./pages/Branding";
import AppSettings from "./pages/AppSettings";
import Notepad from "./pages/Notepad";
import Support from "./pages/Support";
import SupportAdmin from "./pages/SupportAdmin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><p>Carregando...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("support_admins").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  if (loading || isAdmin === null) return <div className="flex min-h-screen items-center justify-center"><p>Carregando...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/esqueci-senha" element={<ForgotPassword />} />
    <Route path="/redefinir-senha" element={<ResetPassword />} />
    <Route path="/register" element={<Register />} />
    <Route path="/termos" element={<Terms />} />
    <Route path="/privacidade" element={<Privacy />} />
    <Route path="/suporte-admin" element={<AdminRoute><SupportAdmin /></AdminRoute>} />
    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    <Route path="/app" element={<ProtectedRoute><CreditsProvider><AppLayout /></CreditsProvider></ProtectedRoute>}>
      <Route index element={<Dashboard />} />
      <Route path="biblioteca" element={<LibraryPage />} />
      <Route path="bncc" element={<BNCCPlanner />} />
      <Route path="atividades" element={<Activities />} />
      <Route path="slides" element={<SlidesGenerator />} />
      <Route path="jogos" element={<GameFactory />} />
      <Route path="provas" element={<Exams />} />
      <Route path="diagramas" element={<DiagramGenerator />} />
      <Route path="notas" element={<Notepad />} />
      <Route path="suporte" element={<Support />} />
      <Route path="planos" element={<Pricing />} />
      <Route path="timbres" element={<Branding />} />
      <Route path="configuracoes" element={<AppSettings />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
