import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { TrueFalseData } from "../generators/trueFalse";

interface Props {
  data: TrueFalseData;
  config: GameConfig;
}

export default function TrueFalsePreview({ data, config }: Props) {
  return (
    <GameA4Shell header={config.header} title={`Verdadeiro ou Falso: ${data.tema}`} subtitle={`${data.items.length} afirmações`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "5mm" }}>
        {data.items.map((item, i) => (
          <div key={i} style={{ pageBreakInside: "avoid" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "3mm" }}>
              <span style={{ fontWeight: 700, minWidth: "6mm" }}>{i + 1}.</span>
              <span style={{ border: "1px solid #000", width: "6mm", height: "6mm", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "8pt", fontWeight: 700 }}>V</span>
              <span style={{ border: "1px solid #000", width: "6mm", height: "6mm", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "8pt", fontWeight: 700 }}>F</span>
              <span style={{ fontSize: "11pt" }}>{item.statement}</span>
            </div>
            <div style={{ marginLeft: "15mm", marginTop: "2mm" }}>
              <span style={{ fontSize: "9pt", color: "#64748b" }}>Justifique:</span>
              <div style={{ borderBottom: "1px solid #d1d5db", height: "7mm", marginTop: "1mm" }} />
            </div>
          </div>
        ))}
      </div>
    </GameA4Shell>
  );
}
