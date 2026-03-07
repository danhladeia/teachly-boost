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
  const cellSize = gridSize <= 4 ? 32 : gridSize <= 6 ? 28 : 24;
  const boxH = gridSize === 4 ? 2 : gridSize === 6 ? 2 : 3;
  const boxW = gridSize === 4 ? 2 : gridSize === 6 ? 3 : 3;

  return (
    <GameA4Shell header={config.header} title={`Sudoku ${gridSize}x${gridSize}`} subtitle={`${data.grids.length} puzzles`} difficulty={config.difficulty}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8mm", justifyContent: "center" }}>
        {data.grids.map((g, gi) => (
          <div key={gi}>
            <p style={{ textAlign: "center", fontWeight: 600, fontSize: "10pt", marginBottom: "2mm" }}>Puzzle {gi + 1}</p>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`, border: "2px solid #000" }}>
              {g.puzzle.flat().map((num, i) => {
                const r = Math.floor(i / gridSize), c = i % gridSize;
                const borderRight = (c + 1) % boxW === 0 && c + 1 < gridSize ? "2px solid #000" : "1px solid #999";
                const borderBottom = (r + 1) % boxH === 0 && r + 1 < gridSize ? "2px solid #000" : "1px solid #999";
                return (
                  <div key={i} style={{
                    width: cellSize, height: cellSize,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: `${cellSize * 0.5}px`, fontWeight: num ? 700 : 400,
                    borderRight, borderBottom,
                    background: num ? "#f8fafc" : "#fff",
                  }}>
                    {num || ""}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </GameA4Shell>
  );
}
