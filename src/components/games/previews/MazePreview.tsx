import GameA4Shell from "../GameA4Shell";
import type { GameConfig } from "../types";
import type { MazeData } from "../generators/maze";

interface Props {
  data: MazeData;
  config: GameConfig;
}

// Max available area inside the A4 shell (approximate px values)
const MAX_AREA: Record<string, { w: number; h: number }> = {
  small:  { w: 260, h: 260 },
  medium: { w: 410, h: 410 },
  large:  { w: 520, h: 500 },
};

export default function MazePreview({ data, config }: Props) {
  const area = MAX_AREA[data.mazeSize] ?? MAX_AREA.medium;
  // Compute cell size that fits both width and height; never below 2px
  const cellSize = Math.max(2, Math.min(
    Math.floor(area.w / data.size),
    Math.floor(area.h / data.size),
  ));

  const tableSize = cellSize * data.size;
  const labelFontSize = Math.max(7, Math.min(10, cellSize * 1.1));

  // Entrance: top border, column 1  (maze[0][1] = 0)
  // Exit:     bottom border, column s-2  (maze[s-1][s-2] = 0)
  const entranceCol = 1;
  const exitCol = data.size - 2;

  // Approximate pixel offset from left edge to each opening's center
  const entranceLeft = entranceCol * cellSize + cellSize / 2;
  const exitLeft     = exitCol * cellSize + cellSize / 2;

  function cellBackground(cell: number, ri: number, ci: number): string {
    if (cell === 0) {
      if (ri === 0 && ci === entranceCol)    return "#bbf7d0"; // entrance — light green
      if (ri === data.size - 1 && ci === exitCol) return "#fecaca"; // exit — light red
      return "#ffffff";
    }
    return "#1a1a1a";
  }

  return (
    <GameA4Shell
      header={config.header}
      title={`Labirinto${data.tema ? `: ${data.tema}` : ""}`}
      subtitle="Encontre o caminho da entrada até a saída!"
      colorMode={config.colorMode}
    >
      {/* Entrance label — positioned above the entrance gap */}
      <div style={{
        width: tableSize,
        margin: "0 auto",
        position: "relative",
        fontSize: labelFontSize + "pt",
        fontWeight: 800,
        marginBottom: "1.5mm",
        color: "#166534",
      }}>
        <span style={{ position: "absolute", left: Math.max(0, entranceLeft - 30) }}>
          ENTRADA ▼
        </span>
      </div>

      {/* Maze */}
      <div style={{ display: "flex", justifyContent: "center", overflow: "hidden" }}>
        <table
          cellSpacing={0}
          cellPadding={0}
          style={{ borderCollapse: "collapse", border: "2px solid #111" }}
        >
          <tbody>
            {data.grid.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      padding: 0,
                      background: cellBackground(cell, ri, ci),
                      border: "none",
                    }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Exit label — positioned below the exit gap */}
      <div style={{
        width: tableSize,
        margin: "0 auto",
        position: "relative",
        fontSize: labelFontSize + "pt",
        fontWeight: 800,
        marginTop: "1.5mm",
        color: "#991b1b",
      }}>
        <span style={{ position: "absolute", left: Math.max(0, exitLeft - 24) }}>
          ▲ SAÍDA
        </span>
      </div>

      {/* Spacer so the relative-positioned labels don't collapse */}
      <div style={{ height: labelFontSize * 1.6, width: tableSize, margin: "0 auto" }} />
    </GameA4Shell>
  );
}
