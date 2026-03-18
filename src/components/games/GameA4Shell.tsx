import React from "react";
import type { GameHeader, ColorMode } from "./types";

const PAGE_STYLE: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  maxHeight: "297mm",
  padding: "15mm 15mm",
  fontFamily: "'Inter', 'Arial', sans-serif",
  fontSize: "11pt",
  lineHeight: 1.6,
  position: "relative",
  boxSizing: "border-box",
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  overflow: "hidden",
  pageBreakAfter: "always",
  pageBreakInside: "avoid",
  maxWidth: "100vw",
  boxShadow: "0 4px 24px hsl(var(--foreground) / 0.12), 0 1px 6px hsl(var(--foreground) / 0.08)",
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
      className="a4-page-scaled bg-card text-foreground"
      style={{
        ...PAGE_STYLE,
        filter: grayscale ? "grayscale(1)" : highContrast ? "contrast(1.4)" : undefined,
      }}
    >
      {header.showHeader && (
        <div style={{ marginBottom: "4mm" }}>
          {header.bannerUrl ? (
            <>
              <div style={{ textAlign: "center", marginBottom: "4mm" }}>
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
            </>
          ) : null}

          {(header.escola || (header.logoUrl && !header.bannerUrl)) && (
            <div
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: "14pt",
                marginBottom: "4mm",
                fontFamily: "'Montserrat', sans-serif",
                borderBottom: "2px solid hsl(var(--primary))",
                paddingBottom: "3mm",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "3mm",
              }}
            >
              {header.logoUrl && !header.bannerUrl && (
                <img
                  src={header.logoUrl}
                  alt="Logo da escola"
                  style={{ maxHeight: "12mm", objectFit: "contain" }}
                  crossOrigin="anonymous"
                />
              )}
              {header.escola && <span>{header.escola}</span>}
            </div>
          )}

          {(header.professor || header.disciplina || header.serie) && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "2mm 8mm",
                fontSize: "9pt",
                marginBottom: "2mm",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              {header.professor && <span><strong>Professor(a):</strong> {header.professor}</span>}
              {header.disciplina && <span><strong>Disciplina:</strong> {header.disciplina}</span>}
              {header.serie && <span><strong>Série/Turma:</strong> {header.serie}</span>}
            </div>
          )}

          {(header.aluno !== undefined || header.data !== undefined) && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "2mm 10mm",
                fontSize: "10pt",
                marginBottom: "4mm",
                borderBottom: "1px solid hsl(var(--border))",
                paddingBottom: "3mm",
              }}
            >
              {header.aluno !== undefined && (
                <span><strong>Aluno(a):</strong> {header.aluno || "______________________________________"}</span>
              )}
              {header.data !== undefined && (
                <span><strong>Data:</strong> {header.data || "____/____/________"}</span>
              )}
            </div>
          )}
        </div>
      )}

      <h1
        style={{
          textAlign: "center",
          fontSize: "16pt",
          fontWeight: 700,
          fontFamily: "'Montserrat', sans-serif",
          marginBottom: subtitle ? "1mm" : "6mm",
          borderBottom: "1px solid hsl(var(--border))",
          paddingBottom: "3mm",
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            textAlign: "center",
            fontSize: "9pt",
            color: "hsl(var(--muted-foreground))",
            marginBottom: "4mm",
          }}
        >
          {subtitle}
        </p>
      )}

      <div style={{ overflow: "hidden" }}>{children}</div>
    </div>
  );
}
