import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { CrosswordData } from "../generators/crossword";

interface Props {
  data: CrosswordData;
  config: GameConfig;
}

export default function CrosswordPreview({ data, config }: Props) {
  const cellSize = Math.max(20, Math.min(32, 450 / data.size));
  return (
    <GameA4Shell header={config.header} title={`Cruzadinha: ${data.tema}`} subtitle={`${data.clues.length} palavras`} difficulty={config.difficulty}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "5mm" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${data.size}, ${cellSize}px)` }}>
          {data.grid.flat().map((cell, i) => (
            <div key={i} style={{
              width: cellSize, height: cellSize,
              border: cell.empty ? "none" : "1px solid #000",
              background: cell.empty ? "transparent" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", fontSize: `${cellSize * 0.45}px`, fontWeight: 600,
            }}>
              {cell.number && (
                <span style={{ position: "absolute", top: 1, left: 2, fontSize: "7px", fontWeight: 400 }}>{cell.number}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4mm", fontSize: "10pt" }}>
        <div>
          <strong>Horizontal:</strong>
          {data.clues.filter(c => c.direction === "across").map(c => (
            <p key={c.number} style={{ marginLeft: "3mm" }}>{c.number}. {c.hint}</p>
          ))}
        </div>
        <div>
          <strong>Vertical:</strong>
          {data.clues.filter(c => c.direction === "down").map(c => (
            <p key={c.number} style={{ marginLeft: "3mm" }}>{c.number}. {c.hint}</p>
          ))}
        </div>
      </div>
    </GameA4Shell>
  );
}
