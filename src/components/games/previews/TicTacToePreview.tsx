import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { TicTacToeData } from "../generators/ticTacToe";

interface Props {
  data: TicTacToeData;
  config: GameConfig;
}

export default function TicTacToePreview({ data, config }: Props) {
  const cellSize = 28;
  return (
    <GameA4Shell header={config.header} title={`Jogo da Velha Pedagógico: ${data.tema}`} subtitle={`${data.grids.length} tabuleiros`} difficulty={config.difficulty}>
      <p style={{ fontSize: "9pt", color: "#64748b", textAlign: "center", marginBottom: "4mm" }}>
        Resolva a pergunta/tarefa da célula antes de marcar X ou O.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6mm" }}>
        {data.grids.map((g, gi) => (
          <div key={gi}>
            <p style={{ textAlign: "center", fontWeight: 600, fontSize: "9pt", marginBottom: "2mm" }}>Tabuleiro {gi + 1}</p>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(3, ${cellSize}px)`, border: "2px solid #000", justifyContent: "center" }}>
              {g.cells.map((cell, ci) => (
                <div key={ci} style={{
                  width: cellSize, height: cellSize * 1.2,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid #000", fontSize: "7pt", textAlign: "center",
                  padding: "1px", overflow: "hidden", lineHeight: 1.1,
                }}>
                  {cell}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GameA4Shell>
  );
}
