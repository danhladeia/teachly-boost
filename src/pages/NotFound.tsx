import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-display font-bold text-primary">404</h1>
        <p className="mb-2 text-xl font-semibold text-foreground">Página não encontrada</p>
        <p className="mb-6 text-muted-foreground">A página que você procura não existe ou foi movida.</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Início
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;