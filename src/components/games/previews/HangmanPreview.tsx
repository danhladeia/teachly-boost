import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { HangmanData } from "../generators/hangman";

interface Props {
  data: HangmanData;
  config: GameConfig;
}

export default function HangmanPreview({ data, config }: Props) {
  return (
    <GameA4Shell header={config.header} title={`Forca: ${data.tema}`} subtitle={`${data.items.length} palavras`}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6mm" }}>
        {data.items.map((item, i) => (
          <div key={i} style={{ border: "1px solid #000", borderRadius: "2mm", padding: "4mm", pageBreakInside: "avoid" }}>
            <p style={{ fontSize: "9pt", color: "#64748b", marginBottom: "2mm" }}>Dica: {item.hint}</p>
            {/* Simple gallows SVG */}
            <svg viewBox="0 0 100 80" style={{ width: "60px", height: "48px", display: "block", margin: "0 auto 2mm" }}>
              <line x1="10" y1="75" x2="40" y2="75" stroke="#000" strokeWidth="2" />
              <line x1="25" y1="75" x2="25" y2="10" stroke="#000" strokeWidth="2" />
              <line x1="25" y1="10" x2="60" y2="10" stroke="#000" strokeWidth="2" />
              <line x1="60" y1="10" x2="60" y2="20" stroke="#000" strokeWidth="2" />
            </svg>
            <div style={{ display: "flex", justifyContent: "center", gap: "2mm", marginTop: "2mm" }}>
              {item.word.split("").map((_, li) => (
                <span key={li} style={{ width: "6mm", borderBottom: "2px solid #000", display: "inline-block", textAlign: "center" }}>&nbsp;</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GameA4Shell>
  );
}
