import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { MazeData } from "../generators/maze";

interface Props {
  data: MazeData;
  config: GameConfig;
}

export default function MazePreview({ data, config }: Props) {
  const maxWidth = data.mazeSize === "small" ? 260 : data.mazeSize === "large" ? 500 : 400;
  const cellSize = Math.min(Math.floor(maxWidth / data.size), Math.floor(560 / data.size));

  return (
    <GameA4Shell
      header={config.header}
      title={`Labirinto${data.tema ? `: ${data.tema}` : ""}`}
      subtitle="Encontre o caminho da entrada à saída!"
      colorMode={config.colorMode}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "3mm", overflow: "hidden" }}>
        <table cellSpacing={0} cellPadding={0} style={{ borderCollapse: "collapse", border: "2px solid #000" }}>
          <tbody>
            {data.grid.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => {
                  return (
                    <td
                      key={ci}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        padding: 0,
                        background: cell === 1 ? "#1a1a1a" : "#fff",
                        border: "none",
                      }}
                    >
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10pt", fontWeight: 700, marginBottom: "4mm" }}>
        <span>↓ ENTRADA</span>
        <span>SAÍDA →</span>
      </div>
    </GameA4Shell>
  );
}
