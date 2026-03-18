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
  // Calculate cell size to fit within A4 printable area (190mm ≈ 718px at 96dpi)
  const maxGridPx = 560;
  const baseCell = Math.max(14, Math.min(28, Math.floor(maxGridPx / gridLen)));
  const cellSize = Math.floor(baseCell * (data.spacing || 1));
  const isCircle = data.cellFormat === "circle";
  const isNoBg = data.cellFormat === "none";

  return (
    <GameA4Shell
      header={config.header}
      title={`Caça-Palavras: ${data.tema}`}
      subtitle={data.hideWordList ? "Encontre as palavras relacionadas ao tema!" : `Encontre ${data.placedWords.length} palavras`}
      colorMode={config.colorMode}
    >
      {config.customInstructions && (
        <p style={{ textAlign: "center", fontSize: "9pt", fontStyle: "italic", marginBottom: "4mm", color: "hsl(var(--muted-foreground))" }}>
          📝 {config.customInstructions}
        </p>
      )}

      {data.miniText && (
        <div style={{
          marginBottom: "5mm",
          padding: "3mm 4mm",
          border: "1px solid hsl(var(--border))",
          borderRadius: "2mm",
          background: "hsl(var(--muted) / 0.35)",
          fontSize: "10pt",
          lineHeight: 1.6,
          textAlign: "justify",
        }}>
          <p style={{ fontWeight: 700, fontSize: "10pt", marginBottom: "2mm" }}>📖 Leia o texto e encontre as palavras em destaque no caça-palavras:</p>
          <p>{data.miniText}</p>
        </div>
      )}

      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        marginBottom: "5mm", 
        overflow: "hidden",
        pageBreakInside: "avoid",
      }}>
        <table
          cellSpacing={0}
          cellPadding={0}
          style={{
            borderCollapse: "collapse",
            border: isCircle || isNoBg ? "none" : "2px solid #000",
            tableLayout: "fixed",
          }}
        >
          <tbody>
            {data.grid.map((row, ri) => (
              <tr key={ri}>
                {row.map((letter, ci) => (
                  <td
                    key={ci}
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                      minWidth: `${cellSize}px`,
                      maxWidth: `${cellSize}px`,
                      textAlign: "center",
                      verticalAlign: "middle",
                      fontSize: `${Math.floor(cellSize * 0.5)}px`,
                      fontWeight: 600,
                      fontFamily: "'Courier New', Courier, monospace",
                      lineHeight: `${cellSize}px`,
                      padding: 0,
                      border: isCircle || isNoBg ? "none" : "1px solid #d1d5db",
                      borderRadius: isCircle ? "50%" : undefined,
                      background: isCircle ? "#f8fafc" : isNoBg ? "transparent" : "#fff",
                      boxSizing: "border-box",
                    }}
                  >
                    {letter}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!data.hideWordList && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "3mm",
          justifyContent: "center",
        }}>
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

      {data.hideWordList && !data.miniText && (
        <p style={{ textAlign: "center", fontSize: "9pt", fontStyle: "italic", color: "#666", marginTop: "3mm" }}>
          💡 Dica: Todas as palavras estão relacionadas ao tema "{data.tema}".
        </p>
      )}
    </GameA4Shell>
  );
}
