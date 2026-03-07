import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { PixelArtData } from "../generators/pixelArt";

interface Props {
  data: PixelArtData;
  config: GameConfig;
}

export default function PixelArtPreview({ data, config }: Props) {
  const cellSize = Math.max(14, Math.min(24, 400 / data.gridSize));
  const filledSet = new Set(data.filledCells.map(([r, c]) => `${r},${c}`));

  return (
    <GameA4Shell header={config.header} title={`Pixel Art: ${data.tema}`} subtitle="Pinte as coordenadas indicadas">
      {/* Grid */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "5mm" }}>
        <div>
          {/* Column numbers */}
          <div style={{ display: "flex", marginLeft: `${cellSize}px` }}>
            {Array.from({ length: data.gridSize }).map((_, c) => (
              <div key={c} style={{ width: cellSize, textAlign: "center", fontSize: "7pt", fontWeight: 600 }}>{c + 1}</div>
            ))}
          </div>
          {Array.from({ length: data.gridSize }).map((_, r) => (
            <div key={r} style={{ display: "flex" }}>
              <div style={{ width: cellSize, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7pt", fontWeight: 600 }}>{r + 1}</div>
              {Array.from({ length: data.gridSize }).map((_, c) => (
                <div key={c} style={{ width: cellSize, height: cellSize, border: "1px solid #d1d5db", background: "#fff" }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Coordinates list */}
      <div style={{ fontSize: "9pt", marginTop: "4mm" }}>
        <strong>Pinte as seguintes coordenadas (linha, coluna):</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2mm", marginTop: "2mm" }}>
          {data.filledCells.sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([r, c], i) => (
            <span key={i} style={{ border: "1px solid #000", padding: "1mm 2mm", borderRadius: "2px", fontFamily: "monospace", fontWeight: 600 }}>
              ({r + 1},{c + 1})
            </span>
          ))}
        </div>
      </div>
    </GameA4Shell>
  );
}
