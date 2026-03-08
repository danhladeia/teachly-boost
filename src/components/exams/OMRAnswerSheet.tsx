import { useEffect, useRef } from "react";

interface OMRAnswerSheetProps {
  titulo: string;
  escola: string;
  professor: string;
  turma: string;
  numMcQuestions: number;
  /** Either a versao_id UUID (new system) or inline gabarito (legacy) */
  versaoId?: string;
  gabarito?: { q: number; correct: number }[];
}

/**
 * Printable OMR answer sheet with QR Code containing versao_id UUID
 */
export default function OMRAnswerSheet({ titulo, escola, professor, turma, numMcQuestions, versaoId, gabarito }: OMRAnswerSheetProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateQr();
  }, [versaoId, gabarito, titulo]);

  const generateQr = async () => {
    if (!versaoId && (!gabarito || gabarito.length === 0)) return;
    try {
      const QRCode = (await import("qrcode")).default;
      const canvas = qrCanvasRef.current;
      if (!canvas) return;

      // New system: QR contains only the version UUID for compact encoding
      // Legacy fallback: full gabarito inline
      const payload = versaoId
        ? JSON.stringify({ v: versaoId })
        : JSON.stringify({
            titulo: titulo || "Prova",
            gabarito,
            numQ: numMcQuestions,
            gridMeta: { cols: Math.ceil(numMcQuestions / 10), rowsPerCol: 10, alternatives: 4 },
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

      {/* Alignment marks */}
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

      {/* Bubble grid + QR Code */}
      <div style={{ display: "flex", gap: "10mm", alignItems: "flex-start" }}>
        <div data-omr-grid style={{ flex: 1, display: "flex", gap: "8mm", flexWrap: "wrap" }}>
          {columns.map((col, ci) => (
            <div key={ci} style={{ minWidth: "30mm" }} data-omr-col={ci}>
              <div style={{ display: "flex", gap: "2mm", alignItems: "center", marginBottom: "3mm", paddingLeft: "9mm" }}>
                {["A", "B", "C", "D"].map(l => (
                  <div key={l} style={{ width: "5mm", textAlign: "center", fontSize: "7pt", fontWeight: 700, color: "#475569" }}>{l}</div>
                ))}
              </div>
              {col.map(qNum => (
                <div key={qNum} data-omr-row={qNum} style={{ display: "flex", alignItems: "center", gap: "2mm", marginBottom: "2mm" }}>
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

        <div style={{ textAlign: "center", flexShrink: 0, padding: "3mm", border: "1px solid #e2e8f0", borderRadius: "2mm" }}>
          <canvas ref={qrCanvasRef} style={{ width: "35mm", height: "35mm" }} />
          <p style={{ fontSize: "6pt", color: "#94a3b8", marginTop: "1mm" }}>Não cubra este QR Code</p>
        </div>
      </div>
    </div>
  );
}
