import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { MazeData } from "../generators/maze";

interface Props {
  data: MazeData;
  config: GameConfig;
}

export default function MazePreview({ data, config }: Props) {
  // Scale maze to fit within printable area (190mm ~ 560px)
  const maxWidth = data.mazeSize === "small" ? 260 : data.mazeSize === "large" ? 500 : 400;
  const cellSize = Math.min(Math.floor(maxWidth / data.size), Math.floor(560 / data.size));
  const hasQuestions = data.questions.length > 0;

  return (
    <GameA4Shell
      header={config.header}
      title={`Labirinto${data.tema ? `: ${data.tema}` : ""}`}
      subtitle={hasQuestions ? "Resolva as perguntas nos checkpoints para avançar!" : "Encontre o caminho da entrada à saída!"}
      colorMode={config.colorMode}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "3mm", overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${data.size}, ${cellSize}px)`,
            border: "2px solid #000",
            maxWidth: "100%",
          }}
        >
          {data.grid.flat().map((cell, i) => {
            const isCheckpoint = cell === 2;
            const checkpoint = isCheckpoint
              ? data.checkpoints.find(cp => cp.row === Math.floor(i / data.size) && cp.col === i % data.size)
              : null;

            return (
              <div
                key={i}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: cell === 1 ? "#1a1a1a" : isCheckpoint ? "#fef3c7" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: `${cellSize * 0.5}px`,
                  fontWeight: 700,
                  color: "#b45309",
                }}
              >
                {isCheckpoint && checkpoint ? String.fromCharCode(65 + checkpoint.questionIndex) : ""}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10pt", fontWeight: 700, marginBottom: "4mm" }}>
        <span>↓ ENTRADA</span>
        <span>SAÍDA →</span>
      </div>

      {hasQuestions && (
        <div style={{ borderTop: "2px solid #000", paddingTop: "4mm" }}>
          <p style={{ fontWeight: 700, fontSize: "11pt", marginBottom: "3mm" }}>
            🔒 Perguntas de Bloqueio:
          </p>
          {data.questions.map((q, qi) => (
            <div key={qi} style={{ marginBottom: "4mm", pageBreakInside: "avoid" }}>
              <p style={{ fontWeight: 700, fontSize: "10pt" }}>
                Checkpoint {String.fromCharCode(65 + qi)}: {q.question}
              </p>
              <div style={{ marginLeft: "4mm", marginTop: "1mm" }}>
                {q.alternatives.map((alt, ai) => (
                  <p key={ai} style={{ fontSize: "10pt" }}>
                    ({String.fromCharCode(65 + ai)}) {alt}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </GameA4Shell>
  );
}
