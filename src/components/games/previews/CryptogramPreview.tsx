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
    <GameA4Shell
      header={config.header}
      title={`Criptograma: ${data.tema}`}
      subtitle="Decifre a mensagem secreta usando a tabela de códigos"
      colorMode={config.colorMode}
    >
      {data.cipherTable.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5mm",
            justifyContent: "center",
            marginBottom: "6mm",
            border: "2px solid #000",
            padding: "4mm",
            borderRadius: "2mm",
            background: "#fafafa",
          }}
        >
          {data.cipherTable.map((entry, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: data.isComplex ? "14mm" : "8mm",
                fontSize: "8pt",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "11pt" }}>{entry.letter}</span>
              <span
                style={{
                  borderTop: "1.5px solid #000",
                  width: "100%",
                  textAlign: "center",
                  fontFamily: "monospace",
                  fontSize: data.isComplex ? "7pt" : "9pt",
                  paddingTop: "1mm",
                }}
              >
                {entry.code}
              </span>
            </div>
          ))}
        </div>
      )}

      {data.showTable === "hidden" && (
        <p style={{ textAlign: "center", fontSize: "9pt", fontStyle: "italic", color: "#666", marginBottom: "6mm" }}>
          🔍 Descubra o código por dedução! Analise o padrão da mensagem.
        </p>
      )}

      <div style={{ textAlign: "center", marginBottom: "4mm" }}>
        <p style={{ fontWeight: 700, fontSize: "11pt", marginBottom: "4mm" }}>📩 Mensagem Codificada:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2mm", justifyContent: "center" }}>
          {data.encodedMessage.map((ch, i) =>
            ch.code === " " ? (
              <span key={i} style={{ width: "6mm" }} />
            ) : (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "12pt", fontFamily: "monospace" }}>{ch.code}</span>
                <span style={{ borderBottom: "2px solid #000", width: "8mm", display: "block" }}>&nbsp;</span>
              </div>
            )
          )}
        </div>
      </div>

      <div style={{ marginTop: "8mm", borderTop: "1px dashed #999", paddingTop: "4mm" }}>
        <p style={{ fontSize: "9pt", fontWeight: 600, marginBottom: "3mm" }}>✍️ Mensagem decifrada:</p>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ borderBottom: "1px solid #ccc", height: "10mm", marginBottom: "2mm" }} />
        ))}
      </div>
    </GameA4Shell>
  );
}
