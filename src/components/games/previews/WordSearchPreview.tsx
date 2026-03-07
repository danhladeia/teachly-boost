import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { WordSearchData } from "../generators/wordSearch";

interface Props {
  data: WordSearchData;
  config: GameConfig;
}

export default function WordSearchPreview({ data, config }: Props) {
  const gridLen = data.grid.length;
  const cellSize = Math.max(16, Math.min(28, 480 / gridLen));

  return (
    <GameA4Shell
      header={config.header}
      title={`Caça-Palavras: ${data.tema}`}
      subtitle={data.hideWordList ? "Encontre as palavras relacionadas ao tema!" : `Encontre ${data.placedWords.length} palavras`}
      difficulty={config.difficulty}
      colorMode={config.colorMode}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "5mm" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridLen}, ${cellSize}px)`, border: "2px solid #000" }}>
          {data.grid.flat().map((letter, i) => (
            <div
              key={i}
              style={{
                width: cellSize,
                height: cellSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: `${cellSize * 0.5}px`,
                fontWeight: 600,
                fontFamily: "monospace",
                border: "1px solid #d1d5db",
              }}
            >
              {letter}
            </div>
          ))}
        </div>
      </div>

      {!data.hideWordList && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "3mm", justifyContent: "center" }}>
          {data.placedWords.map((w, i) => (
            <span
              key={i}
              style={{
                padding: "1mm 3mm",
                border: "1px solid #000",
                borderRadius: "2px",
                fontSize: "10pt",
                fontWeight: 600,
              }}
            >
              {w}
            </span>
          ))}
        </div>
      )}

      {data.hideWordList && (
        <p style={{ textAlign: "center", fontSize: "9pt", fontStyle: "italic", color: "#666", marginTop: "3mm" }}>
          💡 Dica: Todas as palavras estão relacionadas ao tema "{data.tema}".
        </p>
      )}
    </GameA4Shell>
  );
}
