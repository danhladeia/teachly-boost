import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { ConnectPairsData } from "../generators/connectPairs";

interface Props {
  data: ConnectPairsData;
  config: GameConfig;
}

export default function ConnectPairsPreview({ data, config }: Props) {
  return (
    <GameA4Shell header={config.header} title={`Ligue os Pares: ${data.tema}`} subtitle={`${data.pairs.length} pares`}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 10mm" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "5mm" }}>
          {data.pairs.map((p, i) => (
            <div key={i} style={{ border: "1px solid #000", borderRadius: "2mm", padding: "2mm 5mm", fontWeight: 600, fontSize: "11pt" }}>
              {p.left}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5mm" }}>
          {data.shuffledRight.map((r, i) => (
            <div key={i} style={{ border: "1px solid #000", borderRadius: "2mm", padding: "2mm 5mm", fontWeight: 600, fontSize: "11pt" }}>
              {r}
            </div>
          ))}
        </div>
      </div>
    </GameA4Shell>
  );
}
