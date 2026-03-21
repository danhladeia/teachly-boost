import { Search, Grid3X3, Lock, MapPin, Gamepad2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface GameDef {
  id: string;
  title: string;
  icon: React.ElementType;
  desc: string;
  needsWords: boolean;
  supportsAI: boolean;
}

export const GAMES: GameDef[] = [
  { id: "caca-palavras", title: "Caça-Palavras", icon: Search, desc: "Grade com palavras escondidas em múltiplas direções", needsWords: true, supportsAI: true },
  { id: "cruzadinha", title: "Palavras Cruzadas", icon: Grid3X3, desc: "Grade com dicas horizontais e verticais", needsWords: true, supportsAI: true },
  { id: "criptograma", title: "Criptograma", icon: Lock, desc: "Decifre a mensagem com tabela de códigos", needsWords: false, supportsAI: true },
  { id: "sudoku", title: "Sudoku", icon: Grid3X3, desc: "Puzzles 4×4 a 9×9 com números ou símbolos", needsWords: false, supportsAI: false },
  { id: "labirinto", title: "Labirinto", icon: MapPin, desc: "Encontre o caminho da entrada à saída", needsWords: false, supportsAI: false },
];

interface Props {
  onSelect: (id: string) => void;
}

export default function GameSelector({ onSelect }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-primary" /> Fábrica de Jogos Pedagógicos
        </h1>
        <p className="text-muted-foreground mt-1">5 jogos educacionais personalizáveis para impressão A4</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map(game => (
          <Card
            key={game.id}
            className="shadow-card cursor-pointer transition-all hover:shadow-elevated hover:scale-[1.02]"
            onClick={() => onSelect(game.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <game.icon className="h-5 w-5" />
                </div>
                <div className="flex gap-1">
                  {game.supportsAI && <Badge variant="secondary" className="text-[10px]">🤖 IA</Badge>}
                  <Badge variant="outline" className="text-[10px]">A4</Badge>
                </div>
              </div>
              <h3 className="font-display font-bold">{game.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{game.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
