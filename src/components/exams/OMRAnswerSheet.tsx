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
 * Renders a printable OMR answer sheet with:
 * - 4 alignment marks (black squares in corners)
 * - Bubble grid for A/B/C/D per question
 * - QR code encoding the answer key
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
      const payload = JSON.stringify({ titulo: titulo || "Prova", gabarito });
      await QRCode.toCanvas(canvas, payload, { width: 140, margin: 1, errorCorrectionLevel: "H" });
    } catch (err) {
      console.error("QR error:", err);
    }
  };

  if (numMcQuestions === 0) return null;

  const MARK_SIZE = "6mm";
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
    <div style={{ pageBreakBefore: "always", position: "relative", padding: "15mm", minHeight: "140mm", borderTop: "2px dashed #94a3b8", marginTop: "10mm" }}>
      {/* ✂ Cut line label */}
      <div style={{ textAlign: "center", fontSize: "7pt", color: "#94a3b8", marginTop: "-3mm", marginBottom: "2mm" }}>
        ✂️ Recorte aqui — Folha de Respostas
      </div>

      {/* Alignment marks - 4 corners */}
      <div style={markStyle} data-omr-mark="tl" />
      <div style={{ ...markStyle, right: 0 }} data-omr-mark="tr" />
      <div style={{ ...markStyle, bottom: 0 }} data-omr-mark="bl" />
      <div style={{ ...markStyle, right: 0, bottom: 0 }} data-omr-mark="br" />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "4mm" }}>
        {escola && <div style={{ fontSize: "10pt", fontWeight: 700, marginBottom: "1mm" }}>{escola}</div>}
        <h2 style={{ fontSize: "12pt", fontWeight: 700, fontFamily: "'Montserrat', sans-serif", marginBottom: "2mm" }}>
          FOLHA DE RESPOSTAS — {titulo || "Prova"}
        </h2>
      </div>

      {/* Student fields */}
      <div style={{ display: "flex", gap: "8mm", fontSize: "9pt", marginBottom: "4mm", borderBottom: "1px solid #cbd5e1", paddingBottom: "3mm" }}>
        <span style={{ flex: 1 }}>Nome: _____________________________________________</span>
        <span>Turma: {turma || "___________"}</span>
        <span>Data: ___/___/___</span>
      </div>

      <p style={{ fontSize: "7pt", color: "#64748b", marginBottom: "4mm" }}>
        ● Preencha <strong>completamente</strong> o círculo da alternativa escolhida com caneta preta ou azul. Não use lápis. Não rasure.
      </p>

      {/* Bubble grid + QR Code side by side */}
      <div style={{ display: "flex", gap: "8mm", alignItems: "flex-start" }}>
        {/* Bubble grid */}
        <div style={{ flex: 1, display: "flex", gap: "6mm", flexWrap: "wrap" }}>
          {columns.map((col, ci) => (
            <div key={ci} style={{ minWidth: "28mm" }}>
              {/* Column header */}
              <div style={{ display: "flex", gap: "1mm", alignItems: "center", marginBottom: "2mm", paddingLeft: "8mm" }}>
                {["A", "B", "C", "D"].map(l => (
                  <div key={l} style={{ width: "5mm", textAlign: "center", fontSize: "7pt", fontWeight: 700, color: "#475569" }}>{l}</div>
                ))}
              </div>
              {/* Questions */}
              {col.map(qNum => (
                <div key={qNum} style={{ display: "flex", alignItems: "center", gap: "1mm", marginBottom: "1.5mm" }}>
                  <span style={{ width: "7mm", textAlign: "right", fontSize: "8pt", fontWeight: 600, color: "#1e293b", paddingRight: "1mm" }}>
                    {qNum}
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
                        border: "1.5px solid #1e293b",
                        background: "transparent",
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* QR Code */}
        <div style={{ textAlign: "center", flexShrink: 0, padding: "2mm", border: "1px solid #e2e8f0", borderRadius: "2mm" }}>
          <canvas ref={qrCanvasRef} style={{ width: "30mm", height: "30mm" }} />
          <p style={{ fontSize: "6pt", color: "#94a3b8", marginTop: "1mm" }}>Não cubra este QR Code</p>
        </div>
      </div>
    </div>
  );
}
