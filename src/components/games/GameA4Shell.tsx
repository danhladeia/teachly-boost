import React from "react";
import type { GameHeader, ColorMode } from "./types";
import { difficultyConfig, type Difficulty } from "./types";

const PAGE_STYLE: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "10mm",
  fontFamily: "'Inter', 'Arial', sans-serif",
  fontSize: "11pt",
  lineHeight: 1.5,
  position: "relative",
  boxSizing: "border-box",
  background: "#fff",
  color: "#000",
};

interface Props {
  header: GameHeader;
  title: string;
  subtitle?: string;
  difficulty: Difficulty;
  colorMode?: ColorMode;
  children: React.ReactNode;
}

export default function GameA4Shell({ header, title, subtitle, difficulty, colorMode = "color", children }: Props) {
  const dc = difficultyConfig[difficulty];
  const grayscale = colorMode === "grayscale";

  return (
    <div id="game-print-area" style={{ ...PAGE_STYLE, filter: grayscale ? "grayscale(1)" : undefined }}>
      {header.showHeader && (
        <div style={{ borderBottom: "2px solid #000", paddingBottom: "3mm", marginBottom: "4mm" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4mm", marginBottom: "2mm" }}>
            {header.logoUrl && (
              <img
                src={header.logoUrl}
                alt="Logo"
                style={{ height: "14mm", maxWidth: "30mm", objectFit: "contain" }}
                crossOrigin="anonymous"
              />
            )}
            {header.escola && (
              <div style={{ textAlign: "center", fontWeight: 700, fontSize: "14pt", fontFamily: "'Montserrat', sans-serif" }}>
                {header.escola}
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", marginTop: "2mm", flexWrap: "wrap", gap: "2mm" }}>
            {header.professor && <span><strong>Professor(a):</strong> {header.professor}</span>}
            {header.disciplina && <span><strong>Disciplina:</strong> {header.disciplina}</span>}
            {header.serie && <span><strong>Série:</strong> {header.serie}</span>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", marginTop: "1mm" }}>
            <span><strong>Aluno(a):</strong> {header.aluno || "________________________________"}</span>
            <span><strong>Data:</strong> {header.data || "____/____/________"}</span>
          </div>
        </div>
      )}

      <h1 style={{ textAlign: "center", fontSize: "16pt", fontWeight: 700, fontFamily: "'Montserrat', sans-serif", marginBottom: "2mm" }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ textAlign: "center", fontSize: "9pt", color: "#64748b", marginBottom: "5mm" }}>
          {subtitle} • Nível: {dc.label}
        </p>
      )}

      <div style={{ fontSize: dc.fontSize }}>
        {children}
      </div>
    </div>
  );
}
