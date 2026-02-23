import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import DidacticSequence from "./pages/DidacticSequence";
import Branding from "./pages/Branding";
import AppSettings from "./pages/AppSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="bncc" element={<BNCCPlanner />} />
            <Route path="atividades" element={<Activities />} />
            <Route path="slides" element={<SlidesGenerator />} />
            <Route path="jogos" element={<GameFactory />} />
            <Route path="provas" element={<Exams />} />
            <Route path="sequencia" element={<DidacticSequence />} />
            <Route path="timbres" element={<Branding />} />
            <Route path="configuracoes" element={<AppSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
