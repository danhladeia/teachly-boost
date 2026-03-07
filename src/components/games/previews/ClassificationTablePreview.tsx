import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { ClassificationTableData } from "../generators/classificationTable";

interface Props {
  data: ClassificationTableData;
  config: GameConfig;
}

export default function ClassificationTablePreview({ data, config }: Props) {
  return (
    <GameA4Shell header={config.header} title={`Tabela de Classificação: ${data.tema}`} subtitle="Organize os itens nas categorias corretas">
      {/* Items to classify */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "3mm", justifyContent: "center", marginBottom: "6mm" }}>
        {data.items.map((item, i) => (
          <span key={i} style={{ border: "1px solid #000", padding: "2mm 4mm", borderRadius: "2mm", fontWeight: 600, fontSize: "11pt" }}>{item}</span>
        ))}
      </div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000" }}>
        <thead>
          <tr>
            {data.headers.map((h, i) => (
              <th key={i} style={{ border: "1px solid #000", padding: "3mm", fontWeight: 700, fontSize: "11pt", background: "#f8fafc" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, ri) => (
            <tr key={ri}>
              {data.headers.map((_, ci) => (
                <td key={ci} style={{ border: "1px solid #000", padding: "3mm", height: "8mm" }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </GameA4Shell>
  );
}
