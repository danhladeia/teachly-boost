import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { AnagramData } from "../generators/anagram";

interface Props {
  data: AnagramData;
  config: GameConfig;
}

export default function AnagramPreview({ data, config }: Props) {
  return (
    <GameA4Shell header={config.header} title={`Anagramas: ${data.tema}`} subtitle={`${data.items.length} palavras embaralhadas`} difficulty={config.difficulty}>
      <div style={{ display: "flex", flexDirection: "column", gap: "5mm" }}>
        {data.items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "4mm", fontSize: "14pt" }}>
            <span style={{ fontWeight: 600, fontSize: "10pt", color: "#64748b" }}>{i + 1}.</span>
            <span style={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: "2mm", border: "1px solid #000", padding: "2mm 4mm", borderRadius: "2mm" }}>
              {item.scrambled}
            </span>
            <span style={{ fontSize: "16pt" }}>→</span>
            <span style={{ borderBottom: "2px solid #000", minWidth: `${item.original.length * 6}mm`, display: "inline-block" }}>&nbsp;</span>
          </div>
        ))}
      </div>
    </GameA4Shell>
  );
}
