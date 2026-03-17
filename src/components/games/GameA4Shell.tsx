import React from "react";
import type { GameHeader, ColorMode } from "./types";

// Base A4 page style — used both on-screen and when printing
const PAGE_STYLE: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  maxHeight: "297mm",
  padding: "15mm 15mm",
  fontFamily: "'Inter', 'Arial', sans-serif",
  fontSize: "11pt",
  lineHeight: 1.5,
  position: "relative",
  boxSizing: "border-box",
  background: "#fff",
  color: "#000",
  overflow: "hidden",
  pageBreakAfter: "always",
  pageBreakInside: "avoid",
  maxWidth: "100vw",
  // Paper-sheet shadow — ignored by most print drivers
  boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 6px rgba(0,0,0,0.08)",
};

interface Props {
  header: GameHeader;
  title: string;
  subtitle?: string;
  colorMode?: ColorMode;
  children: React.ReactNode;
  pageId?: string;
}

export default function GameA4Shell({
  header,
  title,
  subtitle,
  colorMode = "color",
  children,
  pageId,
}: Props) {
  const grayscale = colorMode === "grayscale";
  const highContrast = colorMode === "high-contrast";

  return (
    <div
      id={pageId || "game-print-area"}
      style={{
        ...PAGE_STYLE,
        filter: grayscale ? "grayscale(1)" : highContrast ? "contrast(1.4)" : undefined,
      }}
    >
      {/* ── Cabeçalho institucional ── */}
      {header.showHeader && (
        <div style={{ marginBottom: "4mm" }}>
          {header.bannerUrl ? (
            /* Banner mode — imagem horizontal da escola */
            <>
              <div style={{ textAlign: "center", marginBottom: "2mm" }}>
                <img
                  src={header.bannerUrl}
                  alt="Timbre da escola"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "25mm",
                    objectFit: "contain",
                    display: "block",
                    margin: "0 auto",
                  }}
                  crossOrigin="anonymous"
                />
              </div>
              <div style={{ borderBottom: "1px solid #cbd5e1", paddingBottom: "2mm" }}>
                {(header.professor || header.disciplina || header.serie) && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", flexWrap: "wrap", gap: "2mm" }}>
                    {header.professor && <span><strong>Professor(a):</strong> {header.professor}</span>}
                    {header.disciplina && <span><strong>Disciplina:</strong> {header.disciplina}</span>}
                    {header.serie && <span><strong>Série/Turma:</strong> {header.serie}</span>}
                  </div>
                )}
                {(header.aluno !== undefined || header.data !== undefined) && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", marginTop: "1mm" }}>
                    {header.aluno !== undefined && (
                      <span><strong>Aluno(a):</strong> {header.aluno || "________________________________"}</span>
                    )}
                    {header.data !== undefined && (
                      <span><strong>Data:</strong> {header.data || "____/____/________"}</span>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Logo + nome da escola */
            <div style={{ borderBottom: "2px solid #1e40af", paddingBottom: "3mm" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4mm", marginBottom: "2mm" }}>
                {header.logoUrl && (
                  <img
                    src={header.logoUrl}
                    alt="Logo da escola"
                    style={{ height: "14mm", maxWidth: "30mm", objectFit: "contain" }}
                    crossOrigin="anonymous"
                  />
                )}
                {header.escola && (
                  <div style={{
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "14pt",
                    fontFamily: "'Montserrat', sans-serif",
                    color: "#1e293b",
                  }}>
                    {header.escola}
                  </div>
                )}
              </div>
              {(header.professor || header.disciplina || header.serie) && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", marginTop: "1mm", flexWrap: "wrap", gap: "2mm", color: "#475569" }}>
                  {header.professor && <span><strong>Professor(a):</strong> {header.professor}</span>}
                  {header.disciplina && <span><strong>Disciplina:</strong> {header.disciplina}</span>}
                  {header.serie && <span><strong>Série/Turma:</strong> {header.serie}</span>}
                </div>
              )}
              {(header.aluno !== undefined || header.data !== undefined) && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", marginTop: "1.5mm" }}>
                  {header.aluno !== undefined && (
                    <span><strong>Aluno(a):</strong> {header.aluno || "________________________________"}</span>
                  )}
                  {header.data !== undefined && (
                    <span><strong>Data:</strong> {header.data || "____/____/________"}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Título e subtítulo do jogo ── */}
      <h1 style={{
        textAlign: "center",
        fontSize: "16pt",
        fontWeight: 700,
        fontFamily: "'Montserrat', sans-serif",
        marginBottom: subtitle ? "1mm" : "4mm",
        color: "#0f172a",
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{
          textAlign: "center",
          fontSize: "9pt",
          color: "#64748b",
          marginBottom: "4mm",
        }}>
          {subtitle}
        </p>
      )}

      {/* ── Conteúdo do jogo ── */}
      <div style={{ overflow: "hidden" }}>{children}</div>
    </div>
  );
}
