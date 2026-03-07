import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { MazeData } from "../generators/maze";

interface Props {
  data: MazeData;
  config: GameConfig;
}

export default function MazePreview({ data, config }: Props) {
  const cellSize = Math.max(8, Math.min(20, 450 / data.size));
  return (
    <GameA4Shell header={config.header} title={`Labirinto: ${data.tema}`} subtitle="Encontre a saída!" difficulty={config.difficulty}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${data.grid[0].length}, ${cellSize}px)` }}>
          {data.grid.flat().map((wall, i) => (
            <div key={i} style={{ width: cellSize, height: cellSize, background: wall ? "#000" : "#fff" }} />
          ))}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3mm", fontSize: "10pt", fontWeight: 700 }}>
        <span>↓ ENTRADA</span>
        <span>SAÍDA →</span>
      </div>
    </GameA4Shell>
  );
}
