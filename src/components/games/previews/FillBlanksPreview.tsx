import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { FillBlanksData } from "../generators/fillBlanks";

interface Props {
  data: FillBlanksData;
  config: GameConfig;
}

export default function FillBlanksPreview({ data, config }: Props) {
  return (
    <GameA4Shell header={config.header} title={`Complete as Lacunas: ${data.tema}`} subtitle="Preencha os espaços em branco" difficulty={config.difficulty}>
      {data.paragraphs.map((p, pi) => (
        <div key={pi} style={{ marginBottom: "6mm" }}>
          <p style={{ textAlign: "justify", lineHeight: 2.2, fontSize: "12pt" }}>
            {p.text}
          </p>
          <div style={{ marginTop: "4mm", fontSize: "10pt" }}>
            <strong>Banco de palavras:</strong>{" "}
            {p.blanks.map((b, bi) => (
              <span key={bi} style={{ border: "1px solid #000", padding: "1mm 3mm", marginLeft: "2mm", borderRadius: "2px", fontWeight: 600 }}>{b}</span>
            ))}
          </div>
        </div>
      ))}
    </GameA4Shell>
  );
}
