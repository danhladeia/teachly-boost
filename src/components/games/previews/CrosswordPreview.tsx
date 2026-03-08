import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { CrosswordData } from "../generators/crossword";

interface Props {
  data: CrosswordData;
  config: GameConfig;
}

export default function CrosswordPreview({ data, config }: Props) {
  const cellSize = Math.max(16, Math.min(28, Math.floor(520 / data.size)));

  return (
    <GameA4Shell
      header={config.header}
      title={`Palavras Cruzadas: ${data.tema}`}
      subtitle={`${data.clues.length} palavras`}
      colorMode={config.colorMode}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "5mm", overflow: "hidden" }}>
        <table cellSpacing={0} cellPadding={0} style={{ borderCollapse: "collapse" }}>
          <tbody>
            {Array.from({ length: data.size }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: data.size }).map((_, c) => {
                  const cell = data.grid[r * data.size + c] || data.grid.flat()[r * data.size + c];
                  // Handle both flat and 2D grid formats
                  const cellData = Array.isArray(data.grid[0]) 
                    ? (data.grid as any)[r][c] 
                    : data.grid[r * data.size + c];
                  return (
                    <td
                      key={c}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        border: cellData?.empty ? "none" : "1.5px solid #000",
                        background: cellData?.empty ? "transparent" : "#fff",
                        textAlign: "center",
                        verticalAlign: "middle",
                        position: "relative",
                        fontSize: `${Math.floor(cellSize * 0.45)}px`,
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      {cellData?.number && (
                        <span style={{ position: "absolute", top: 1, left: 2, fontSize: "7px", fontWeight: 400, color: "#333" }}>
                          {cellData.number}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4mm", fontSize: "10pt" }}>
        <div>
          <strong>→ Horizontal:</strong>
          {data.clues.filter(c => c.direction === "across").map(c => (
            <p key={c.number} style={{ marginLeft: "3mm", marginTop: "1mm" }}>
              <strong>{c.number}.</strong> {c.hint}
            </p>
          ))}
        </div>
        <div>
          <strong>↓ Vertical:</strong>
          {data.clues.filter(c => c.direction === "down").map(c => (
            <p key={c.number} style={{ marginLeft: "3mm", marginTop: "1mm" }}>
              <strong>{c.number}.</strong> {c.hint}
            </p>
          ))}
        </div>
      </div>
    </GameA4Shell>
  );
}
