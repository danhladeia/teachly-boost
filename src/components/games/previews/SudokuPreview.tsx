import React from "react";
import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { SudokuData } from "../generators/sudoku";

interface Props {
  data: SudokuData;
  config: GameConfig;
}

export default function SudokuPreview({ data, config }: Props) {
  const gridSize = data.grids[0]?.size || 4;
  const cellSize = gridSize <= 4 ? 34 : gridSize <= 6 ? 28 : 22;
  const boxH = gridSize === 4 ? 2 : gridSize === 6 ? 2 : gridSize === 8 ? 2 : 3;
  const boxW = gridSize === 4 ? 2 : gridSize === 6 ? 3 : gridSize === 8 ? 4 : 3;
  const isText = data.contentType !== "numbers";

  return (
    <GameA4Shell
      header={config.header}
      title={`Sudoku ${gridSize}×${gridSize}`}
      subtitle={`${data.grids.length} puzzles • ${isText ? "Temático" : "Numérico"}`}
      colorMode={config.colorMode}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10mm", justifyContent: "center" }}>
        {data.grids.map((g, gi) => (
          <div key={gi}>
            <p style={{ textAlign: "center", fontWeight: 700, fontSize: "10pt", marginBottom: "2mm" }}>
              Puzzle {gi + 1}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
                border: "3px solid #000",
              }}
            >
              {g.puzzle.flat().map((val, i) => {
                const r = Math.floor(i / gridSize);
                const c = i % gridSize;
                const borderRight = (c + 1) % boxW === 0 && c + 1 < gridSize ? "3px solid #000" : "1px solid #999";
                const borderBottom = (r + 1) % boxH === 0 && r + 1 < gridSize ? "3px solid #000" : "1px solid #999";
                return (
                  <div
                    key={i}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isText ? `${cellSize * 0.35}px` : `${cellSize * 0.5}px`,
                      fontWeight: val ? 700 : 400,
                      borderRight,
                      borderBottom,
                      background: val ? "#f8fafc" : "#fff",
                      fontFamily: isText ? "sans-serif" : "monospace",
                    }}
                  >
                    {val || ""}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {config.sudokuShowScratch && (
        <div style={{ marginTop: "8mm", borderTop: "1px dashed #999", paddingTop: "4mm" }}>
          <p style={{ fontSize: "9pt", fontWeight: 600, marginBottom: "3mm" }}>📝 Espaço para rascunho:</p>
          <div style={{ height: "30mm", border: "1px solid #ddd", borderRadius: "2mm" }} />
        </div>
      )}

      {isText && (
        <div style={{ marginTop: "6mm", textAlign: "center", fontSize: "9pt", color: "#555" }}>
          <strong>Símbolos:</strong>{" "}
          {data.grids[0]?.solution[0]?.filter((v, i, a) => a.indexOf(v) === i).join("  •  ")}
        </div>
      )}
    </GameA4Shell>
  );
}
