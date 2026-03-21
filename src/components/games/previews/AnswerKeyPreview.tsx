import React from "react";
import type { GameConfig } from "../types";
import type { WordSearchData } from "../generators/wordSearch";
import type { CrosswordData } from "../generators/crossword";
import type { CryptogramData } from "../generators/cryptogram";
import type { SudokuData } from "../generators/sudoku";
import type { MazeData } from "../generators/maze";

const PAGE_STYLE: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "20mm 15mm",
  fontFamily: "'Inter', 'Arial', sans-serif",
  fontSize: "11pt",
  lineHeight: 1.5,
  background: "#fff",
  color: "#000",
  boxSizing: "border-box",
  pageBreakBefore: "always",
  overflow: "hidden",
};

interface Props {
  gameType: string;
  gameData: any;
  config: GameConfig;
}

export default function AnswerKeyPreview({ gameType, gameData, config }: Props) {
  return (
    <div id="answer-key-area" style={PAGE_STYLE}>
      {config.header.showHeader && (
        <div style={{ borderBottom: "2px solid #000", paddingBottom: "3mm", marginBottom: "4mm" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4mm", marginBottom: "2mm" }}>
            {config.header.logoUrl && (
              <img src={config.header.logoUrl} alt="Logo" style={{ height: "14mm", maxWidth: "30mm", objectFit: "contain" }} crossOrigin="anonymous" />
            )}
            {config.header.escola && (
              <div style={{ textAlign: "center", fontWeight: 700, fontSize: "14pt", fontFamily: "'Montserrat', sans-serif" }}>
                {config.header.escola}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ borderBottom: "3px solid #000", paddingBottom: "3mm", marginBottom: "6mm", textAlign: "center" }}>
        <h1 style={{ fontSize: "18pt", fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }}>
          📋 GABARITO DO PROFESSOR
        </h1>
        <p style={{ fontSize: "9pt", color: "#666", marginTop: "2mm" }}>
          Este documento é exclusivo para o professor — não distribua aos alunos.
        </p>
      </div>

      {gameType === "caca-palavras" && <WordSearchAnswer data={gameData} />}
      {gameType === "cruzadinha" && <CrosswordAnswer data={gameData} />}
      {gameType === "criptograma" && <CryptogramAnswer data={gameData} />}
      {gameType === "sudoku" && <SudokuAnswer data={gameData} />}
      {gameType === "labirinto" && <MazeAnswer data={gameData} />}
    </div>
  );
}

function WordSearchAnswer({ data }: { data: WordSearchData }) {
  return (
    <div>
      <h2 style={{ fontSize: "13pt", fontWeight: 700, marginBottom: "3mm" }}>🔍 Caça-Palavras — Palavras encontradas</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2mm", marginBottom: "5mm" }}>
        {data.allWords.map((w, i) => (
          <span key={i} style={{ padding: "1mm 2mm", border: "1px solid #000", borderRadius: "2px", fontSize: "9pt", fontWeight: 700 }}>
            {w}
          </span>
        ))}
      </div>
      <p style={{ fontSize: "9pt", color: "#555" }}>Total: {data.allWords.length} palavras</p>
    </div>
  );
}

function CrosswordAnswer({ data }: { data: CrosswordData }) {
  const cellSize = Math.max(14, Math.min(20, Math.floor(480 / data.size)));
  return (
    <div>
      <h2 style={{ fontSize: "13pt", fontWeight: 700, marginBottom: "3mm" }}>✏️ Palavras Cruzadas — Gabarito</h2>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "5mm", overflow: "hidden" }}>
        <table cellSpacing={0} cellPadding={0} style={{ borderCollapse: "collapse" }}>
          <tbody>
            {Array.from({ length: data.size }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: data.size }).map((_, c) => {
                  const cellData = Array.isArray(data.grid[0])
                    ? (data.grid as any)[r][c]
                    : data.grid[r * data.size + c];
                  return (
                    <td key={c} style={{
                      width: `${cellSize}px`, height: `${cellSize}px`,
                      border: cellData?.empty ? "none" : "1px solid #000",
                      background: cellData?.empty ? "transparent" : "#e8f5e9",
                      textAlign: "center", verticalAlign: "middle",
                      fontSize: `${Math.floor(cellSize * 0.5)}px`, fontWeight: 700,
                      position: "relative", padding: 0,
                    }}>
                      {cellData?.number && (
                        <span style={{ position: "absolute", top: 0, left: 1, fontSize: "5px", color: "#333" }}>{cellData.number}</span>
                      )}
                      {!cellData?.empty && cellData?.letter}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3mm", fontSize: "9pt" }}>
        <div>
          <strong>→ Horizontal:</strong>
          {data.clues.filter(c => c.direction === "across").map(c => (
            <p key={c.number} style={{ marginLeft: "3mm" }}><strong>{c.number}.</strong> {c.word}</p>
          ))}
        </div>
        <div>
          <strong>↓ Vertical:</strong>
          {data.clues.filter(c => c.direction === "down").map(c => (
            <p key={c.number} style={{ marginLeft: "3mm" }}><strong>{c.number}.</strong> {c.word}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function CryptogramAnswer({ data }: { data: CryptogramData }) {
  return (
    <div>
      <h2 style={{ fontSize: "13pt", fontWeight: 700, marginBottom: "3mm" }}>🔐 Criptograma — Resposta</h2>
      <div style={{ background: "#e8f5e9", border: "2px solid #4caf50", borderRadius: "3mm", padding: "4mm", textAlign: "center", marginBottom: "4mm" }}>
        <p style={{ fontSize: "14pt", fontWeight: 700, letterSpacing: "2px" }}>{data.answer}</p>
      </div>
      <h3 style={{ fontSize: "11pt", fontWeight: 700, marginBottom: "2mm" }}>Tabela completa de substituição:</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1mm", justifyContent: "center" }}>
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l, i) => {
          const full = data.encodedMessage.find(e => e.letter === l);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "7mm", fontSize: "7pt" }}>
              <span style={{ fontWeight: 700 }}>{l}</span>
              <span style={{ borderTop: "1px solid #000", width: "100%", textAlign: "center", fontFamily: "monospace" }}>
                {full?.code || "?"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SudokuAnswer({ data }: { data: SudokuData }) {
  const gridSize = data.grids[0]?.size || 4;
  const count = data.grids.length;
  const maxPerRow = count > 2 ? 2 : count;
  const availableWidth = 520 / maxPerRow - 16;
  const cellSize = Math.max(12, Math.min(22, Math.floor(availableWidth / gridSize)));
  const boxH = gridSize === 4 ? 2 : gridSize === 6 ? 2 : 3;
  const boxW = gridSize === 4 ? 2 : gridSize === 6 ? 3 : 3;

  return (
    <div>
      <h2 style={{ fontSize: "13pt", fontWeight: 700, marginBottom: "3mm" }}>🧩 Sudoku — Soluções</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6mm", justifyContent: "center", overflow: "hidden" }}>
        {data.grids.map((g, gi) => (
          <div key={gi}>
            <p style={{ textAlign: "center", fontWeight: 700, fontSize: "9pt", marginBottom: "1mm" }}>Puzzle {gi + 1}</p>
            <table cellSpacing={0} cellPadding={0} style={{ borderCollapse: "collapse", border: "2px solid #000" }}>
              <tbody>
                {Array.from({ length: gridSize }).map((_, r) => (
                  <tr key={r}>
                    {Array.from({ length: gridSize }).map((_, c) => {
                      const val = g.solution[r][c];
                      const wasEmpty = g.puzzle[r][c] === null;
                      const borderRight = (c + 1) % boxW === 0 && c + 1 < gridSize ? "2px solid #000" : "1px solid #999";
                      const borderBottom = (r + 1) % boxH === 0 && r + 1 < gridSize ? "2px solid #000" : "1px solid #999";
                      return (
                        <td key={c} style={{
                          width: `${cellSize}px`, height: `${cellSize}px`,
                          textAlign: "center", verticalAlign: "middle",
                          fontSize: `${Math.floor(cellSize * 0.5)}px`, fontWeight: 700,
                          borderRight, borderBottom, padding: 0,
                          background: wasEmpty ? "#e8f5e9" : "#fff",
                          color: wasEmpty ? "#2e7d32" : "#000",
                        }}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

function MazeAnswer({ data }: { data: MazeData }) {
  return (
    <div>
      <h2 style={{ fontSize: "13pt", fontWeight: 700, marginBottom: "3mm" }}>🏁 Labirinto — Respostas dos Checkpoints</h2>
      {data.questions.length > 0 ? (
        data.questions.map((q, qi) => (
          <div key={qi} style={{ marginBottom: "4mm", padding: "3mm", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "2mm" }}>
            <p style={{ fontWeight: 700, fontSize: "10pt" }}>
              Checkpoint {String.fromCharCode(65 + qi)}: {q.question}
            </p>
            <p style={{ fontSize: "10pt", color: "#166534", fontWeight: 700, marginTop: "1mm" }}>
              ✅ Resposta correta: ({String.fromCharCode(65 + q.correctIndex)}) {q.alternatives[q.correctIndex]}
            </p>
          </div>
        ))
      ) : (
        <p style={{ fontSize: "10pt", color: "#666" }}>Este labirinto não possui perguntas de bloqueio.</p>
      )}
    </div>
  );
}
