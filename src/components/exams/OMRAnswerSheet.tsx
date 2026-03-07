import { useEffect, useRef } from "react";

interface OMRAnswerSheetProps {
  titulo: string;
  escola: string;
  professor: string;
  turma: string;
  numMcQuestions: number;
  gabarito: { q: number; correct: number }[];
}

/**
 * Printable OMR answer sheet with:
 * - 4 large alignment marks (filled black squares) at exact corners
 * - Structured bubble grid with consistent spacing
 * - QR code encoding answer key + metadata
 * 
 * Layout is designed for reliable computer-vision detection:
 * - Alignment marks are 8mm filled squares
 * - Bubbles are 5mm diameter circles with 7mm center-to-center spacing
 * - Grid starts at a fixed offset from top-left alignment mark
 */
export default function OMRAnswerSheet({ titulo, escola, professor, turma, numMcQuestions, gabarito }: OMRAnswerSheetProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateQr();
  }, [gabarito, titulo]);

  const generateQr = async () => {
    if (gabarito.length === 0) return;
    try {
      const QRCode = (await import("qrcode")).default;
      const canvas = qrCanvasRef.current;
      if (!canvas) return;
      const payload = JSON.stringify({
        titulo: titulo || "Prova",
        gabarito,
        numQ: numMcQuestions,
        // Grid metadata for scanner alignment
        gridMeta: {
          cols: Math.ceil(numMcQuestions / 10),
          rowsPerCol: 10,
          alternatives: 4,
        },
      });
      await QRCode.toCanvas(canvas, payload, { width: 160, margin: 1, errorCorrectionLevel: "H" });
    } catch (err) {
      console.error("QR error:", err);
    }
  };

  if (numMcQuestions === 0) return null;

  const MARK_SIZE = "8mm";
  const markStyle: React.CSSProperties = {
    width: MARK_SIZE,
    height: MARK_SIZE,
    background: "#000",
    position: "absolute",
  };

  // Split questions into columns of 10
  const columns: number[][] = [];
  for (let i = 0; i < numMcQuestions; i += 10) {
    columns.push(Array.from({ length: Math.min(10, numMcQuestions - i) }, (_, j) => i + j + 1));
  }

  return (
    <div
      data-omr-sheet
      style={{
        pageBreakBefore: "always",
        position: "relative",
        padding: "15mm",
        minHeight: "200mm",
        borderTop: "2px dashed #94a3b8",
        marginTop: "10mm",
      }}
    >
      {/* ✂ Cut line label */}
      <div style={{ textAlign: "center", fontSize: "7pt", color: "#94a3b8", marginTop: "-3mm", marginBottom: "2mm" }}>
        ✂️ Recorte aqui — Folha de Respostas
      </div>

      {/* Alignment marks - 4 corners - large filled squares for CV detection */}
      <div style={{ ...markStyle, top: "10mm", left: "10mm" }} data-omr-mark="tl" />
      <div style={{ ...markStyle, top: "10mm", right: "10mm" }} data-omr-mark="tr" />
      <div style={{ ...markStyle, bottom: "10mm", left: "10mm" }} data-omr-mark="bl" />
      <div style={{ ...markStyle, bottom: "10mm", right: "10mm" }} data-omr-mark="br" />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "4mm" }}>
        {escola && <div style={{ fontSize: "10pt", fontWeight: 700, marginBottom: "1mm" }}>{escola}</div>}
        <h2 style={{ fontSize: "13pt", fontWeight: 700, fontFamily: "'Montserrat', sans-serif", marginBottom: "2mm" }}>
          FOLHA DE RESPOSTAS — {titulo || "Prova"}
        </h2>
      </div>

      {/* Student fields */}
      <div style={{ display: "flex", gap: "8mm", fontSize: "9pt", marginBottom: "4mm", borderBottom: "1px solid #cbd5e1", paddingBottom: "3mm" }}>
        <span style={{ flex: 1 }}>Nome: _____________________________________________</span>
        <span>Turma: {turma || "___________"}</span>
        <span>Data: ___/___/___</span>
      </div>

      <p style={{ fontSize: "7pt", color: "#64748b", marginBottom: "5mm" }}>
        ● Preencha <strong>completamente</strong> o círculo da alternativa escolhida com caneta preta ou azul. Não use lápis. Não rasure.
      </p>

      {/* Bubble grid + QR Code side by side */}
      <div style={{ display: "flex", gap: "10mm", alignItems: "flex-start" }}>
        {/* Bubble grid - fixed spacing for CV detection */}
        <div
          data-omr-grid
          style={{ flex: 1, display: "flex", gap: "8mm", flexWrap: "wrap" }}
        >
          {columns.map((col, ci) => (
            <div key={ci} style={{ minWidth: "30mm" }} data-omr-col={ci}>
              {/* Column header A B C D */}
              <div style={{ display: "flex", gap: "2mm", alignItems: "center", marginBottom: "3mm", paddingLeft: "9mm" }}>
                {["A", "B", "C", "D"].map(l => (
                  <div key={l} style={{ width: "5mm", textAlign: "center", fontSize: "7pt", fontWeight: 700, color: "#475569" }}>{l}</div>
                ))}
              </div>
              {/* Questions in this column */}
              {col.map(qNum => (
                <div
                  key={qNum}
                  data-omr-row={qNum}
                  style={{ display: "flex", alignItems: "center", gap: "2mm", marginBottom: "2mm" }}
                >
                  <span style={{ width: "8mm", textAlign: "right", fontSize: "8pt", fontWeight: 600, color: "#1e293b", paddingRight: "1mm" }}>
                    {String(qNum).padStart(2, "0")}
                  </span>
                  {[0, 1, 2, 3].map(altIdx => (
                    <div
                      key={altIdx}
                      data-omr-q={qNum}
                      data-omr-alt={altIdx}
                      style={{
                        width: "5mm",
                        height: "5mm",
                        borderRadius: "50%",
                        border: "1.8px solid #1e293b",
                        background: "transparent",
                        boxSizing: "border-box",
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* QR Code */}
        <div style={{ textAlign: "center", flexShrink: 0, padding: "3mm", border: "1px solid #e2e8f0", borderRadius: "2mm" }}>
          <canvas ref={qrCanvasRef} style={{ width: "35mm", height: "35mm" }} />
          <p style={{ fontSize: "6pt", color: "#94a3b8", marginTop: "1mm" }}>Não cubra este QR Code</p>
        </div>
      </div>
    </div>
  );
}
