import { useState } from "react";
import { Gamepad2, Search as SearchIcon, Grid3X3, Hash, MapPin, Palette, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const games = [
  { id: "caca-palavras", title: "Caça-Palavras", icon: SearchIcon, desc: "Encontre palavras escondidas na grade", available: true, difficulty: "Fácil" },
  { id: "cruzadinha", title: "Cruzadinha", icon: Hash, desc: "Preencha a grade com as dicas", available: true, difficulty: "Médio" },
  { id: "sudoku", title: "Sudoku Temático", icon: Grid3X3, desc: "Sudoku com temas personalizados", available: true, difficulty: "Variável" },
  { id: "labirinto", title: "Labirinto", icon: MapPin, desc: "Encontre o caminho do início ao fim", available: true, difficulty: "Variável" },
  { id: "pixel-art", title: "Pixel Art Matemático", icon: Palette, desc: "Pinte coordenadas e revele o desenho", available: true, difficulty: "Fácil" },
  { id: "memoria", title: "Jogo da Memória", icon: Grid3X3, desc: "Pares de cartas temáticas", available: false, difficulty: "Fácil" },
  { id: "forca", title: "Forca", icon: Hash, desc: "Adivinhe a palavra letra por letra", available: false, difficulty: "Fácil" },
  { id: "quiz", title: "Quiz Interativo", icon: Hash, desc: "Perguntas e respostas temáticas", available: false, difficulty: "Médio" },
];

export default function GameFactory() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [palavras, setPalavras] = useState("");
  const [tema, setTema] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-primary" /> Fábrica de Jogos
        </h1>
        <p className="text-muted-foreground mt-1">20 tipos de jogos pedagógicos para imprimir e usar em sala</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {games.map((game) => (
          <Card
            key={game.id}
            className={`shadow-card cursor-pointer transition-all hover:shadow-elevated ${selectedGame === game.id ? "ring-2 ring-primary" : ""} ${!game.available ? "opacity-60" : ""}`}
            onClick={() => game.available && setSelectedGame(game.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {game.available ? <game.icon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                <Badge variant="secondary" className="text-xs">{game.difficulty}</Badge>
              </div>
              <h3 className="font-display font-bold text-sm">{game.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{game.desc}</p>
              {!game.available && <p className="text-xs text-plan-pratico font-medium mt-2">Plano Prático+</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedGame === "caca-palavras" && (
        <Card className="shadow-card max-w-2xl">
          <CardHeader><CardTitle className="font-display text-lg">Caça-Palavras</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tema do jogo</Label>
              <Input placeholder="Ex: Sistema Solar, Animais, Cores" value={tema} onChange={(e) => setTema(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Palavras-chave (separadas por vírgula)</Label>
              <Input placeholder="Ex: sol, lua, terra, marte, jupiter" value={palavras} onChange={(e) => setPalavras(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button className="gradient-primary border-0 text-primary-foreground hover:opacity-90">Gerar Jogo</Button>
              <Button variant="outline">Imprimir</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
