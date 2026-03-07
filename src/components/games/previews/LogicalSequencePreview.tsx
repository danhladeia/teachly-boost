import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { LogicalSequenceData } from "../generators/logicalSequence";

interface Props {
  data: LogicalSequenceData;
  config: GameConfig;
}

export default function LogicalSequencePreview({ data, config }: Props) {
  return (
    <GameA4Shell header={config.header} title={`Sequências Lógicas: ${data.tema}`} subtitle={`${data.items.length} sequências`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "5mm" }}>
        {data.items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "3mm" }}>
            <span style={{ fontWeight: 600, fontSize: "10pt", color: "#64748b", minWidth: "6mm" }}>{i + 1}.</span>
            {item.sequence.map((s, si) => (
              <span key={si} style={{
                width: "10mm", height: "10mm",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                border: s === "?" ? "2px dashed #000" : "1px solid #d1d5db",
                borderRadius: "2mm",
                fontWeight: 700, fontSize: "12pt", fontFamily: "monospace",
                background: s === "?" ? "#f8fafc" : "#fff",
              }}>
                {s === "?" ? "" : s}
              </span>
            ))}
          </div>
        ))}
      </div>
    </GameA4Shell>
  );
}
