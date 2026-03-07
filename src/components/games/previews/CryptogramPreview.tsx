import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { CryptogramData } from "../generators/cryptogram";

interface Props {
  data: CryptogramData;
  config: GameConfig;
}

export default function CryptogramPreview({ data, config }: Props) {
  return (
    <GameA4Shell header={config.header} title={`Criptograma: ${data.tema}`} subtitle="Decifre a mensagem secreta" difficulty={config.difficulty}>
      {/* Cipher table */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1mm", justifyContent: "center", marginBottom: "6mm", border: "1px solid #000", padding: "3mm", borderRadius: "2mm" }}>
        {data.cipherTable.map((entry, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "8mm", fontSize: "8pt" }}>
            <span style={{ fontWeight: 700 }}>{entry.letter}</span>
            <span style={{ borderTop: "1px solid #000", width: "100%", textAlign: "center" }}>{entry.code}</span>
          </div>
        ))}
      </div>

      {/* Encoded message */}
      <div style={{ textAlign: "center", marginBottom: "4mm" }}>
        <p style={{ fontWeight: 600, fontSize: "10pt", marginBottom: "3mm" }}>Mensagem Codificada:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2mm", justifyContent: "center" }}>
          {data.encodedMessage.map((ch, i) => (
            ch.code === " " ? <span key={i} style={{ width: "5mm" }} /> :
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "12pt", fontFamily: "monospace" }}>{ch.code}</span>
              <span style={{ borderBottom: "2px solid #000", width: "7mm", display: "block" }}>&nbsp;</span>
            </div>
          ))}
        </div>
      </div>
    </GameA4Shell>
  );
}
