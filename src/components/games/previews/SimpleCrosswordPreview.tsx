import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { SimpleCrosswordData } from "../generators/simpleCrossword";

interface Props {
  data: SimpleCrosswordData;
  config: GameConfig;
}

export default function SimpleCrosswordPreview({ data, config }: Props) {
  const cellSize = 28;
  return (
    <GameA4Shell header={config.header} title={`Cruzadinha Simplificada: ${data.tema}`} subtitle={`Grade ${data.size}x${data.size}`}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "5mm" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${data.size}, ${cellSize}px)`, border: "2px solid #000" }}>
          {Array.from({ length: data.size * data.size }).map((_, i) => (
            <div key={i} style={{ width: cellSize, height: cellSize, border: "1px solid #000", background: "#fff" }} />
          ))}
        </div>
      </div>
      <div style={{ fontSize: "10pt" }}>
        <strong>Palavras para encaixar:</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "3mm", marginTop: "2mm" }}>
          {data.words.map((w, i) => (
            <span key={i} style={{ border: "1px solid #000", padding: "1mm 3mm", borderRadius: "2px", fontWeight: 600 }}>{w}</span>
          ))}
        </div>
      </div>
    </GameA4Shell>
  );
}
