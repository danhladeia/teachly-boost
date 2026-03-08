import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CreditsProvider } from "@/hooks/useCredits";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import BNCCPlanner from "./pages/BNCCPlanner";
import Activities from "./pages/Activities";
import SlidesGenerator from "./pages/SlidesGenerator";
import GameFactory from "./pages/GameFactory";
import Exams from "./pages/Exams";
import Pricing from "./pages/Pricing";
import Branding from "./pages/Branding";
import AppSettings from "./pages/AppSettings";
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

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/app" element={<ProtectedRoute><CreditsProvider><AppLayout /></CreditsProvider></ProtectedRoute>}>
      <Route index element={<Dashboard />} />
      <Route path="bncc" element={<BNCCPlanner />} />
      <Route path="atividades" element={<Activities />} />
      <Route path="slides" element={<SlidesGenerator />} />
      <Route path="jogos" element={<GameFactory />} />
      <Route path="provas" element={<Exams />} />
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
