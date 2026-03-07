import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { CompleteWordData } from "../generators/completeWord";

interface Props {
  data: CompleteWordData;
  config: GameConfig;
}

export default function CompleteWordPreview({ data, config }: Props) {
  return (
    <GameA4Shell header={config.header} title={`Complete a Palavra: ${data.tema}`} subtitle={`${data.items.length} palavras`}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4mm" }}>
        {data.items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "3mm", fontSize: "14pt", fontFamily: "monospace", fontWeight: 600, padding: "2mm 0" }}>
            <span style={{ color: "#64748b", fontSize: "10pt", minWidth: "5mm" }}>{i + 1}.</span>
            {item.masked.split("").map((ch, ci) => (
              <span key={ci} style={{
                width: "7mm", height: "9mm",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                borderBottom: ch === "_" ? "2px solid #000" : "none",
                fontSize: "14pt",
              }}>
                {ch === "_" ? "" : ch}
              </span>
            ))}
          </div>
        ))}
      </div>
    </GameA4Shell>
  );
}
