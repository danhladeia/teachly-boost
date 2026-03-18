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
                  const cellData = Array.isArray(data.grid[0])
                    ? (data.grid as any)[r][c]
                    : data.grid[r * data.size + c];
                  return (
                    <td
                      key={c}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        border: cellData?.empty ? "none" : "1.5px solid hsl(var(--foreground))",
                        background: cellData?.empty ? "transparent" : "hsl(var(--card))",
                        textAlign: "center",
                        verticalAlign: "middle",
                        position: "relative",
                        fontSize: `${Math.floor(cellSize * 0.45)}px`,
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      {cellData?.number && (
                        <span style={{ position: "absolute", top: 1, left: 2, fontSize: "7px", fontWeight: 400, color: "hsl(var(--muted-foreground))" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4mm", fontSize: "10pt", borderTop: "1px solid hsl(var(--border))", paddingTop: "4mm" }}>
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
