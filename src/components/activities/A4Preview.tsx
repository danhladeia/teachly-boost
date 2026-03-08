import { useEffect, useRef } from "react";
import type { Block } from "./types";

interface A4PreviewProps {
  blocks: Block[];
  showHeader: boolean;
  escola: string;
  autoNumber: boolean;
  professor?: string;
  turma?: string;
}

function renderKaTeX(text: string): string {
  try {
    const katex = (window as any).katex;
    if (!katex) return text.replace(/\n/g, "<br/>");
    return text.replace(/\$(.+?)\$/g, (_, formula) => {
      try {
        return katex.renderToString(formula, { throwOnError: false });
      } catch {
        return `<code>${formula}</code>`;
      }
    }).replace(/\n/g, "<br/>");
  } catch {
    return text.replace(/\n/g, "<br/>");
  }
}

const PAGE_STYLE: React.CSSProperties = {
  width: "100%",
  maxWidth: "210mm",
  minHeight: "297mm",
  padding: "15mm",
  fontFamily: "'Inter', 'Arial', sans-serif",
  fontSize: "11pt",
  lineHeight: 1.6,
  position: "relative",
  boxSizing: "border-box",
};

export default function A4Preview({ blocks, showHeader, escola, autoNumber, professor, turma }: A4PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!(window as any).katex) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js";
      document.head.appendChild(script);
    }
  }, []);

  const imageSizeMap = { small: "30%", medium: "50%", large: "80%" };

  return (
    <div className="bg-muted/30 rounded-lg p-2 sm:p-4 flex justify-center w-full overflow-hidden">
      <div
        id="atividade-print-area"
        ref={containerRef}
        className="bg-white text-black shadow-lg"
        style={PAGE_STYLE}
      >
        {showHeader && escola && (
          <div style={{ textAlign: "center", fontWeight: 700, fontSize: "14pt", marginBottom: "4mm", fontFamily: "'Montserrat', sans-serif", borderBottom: "2px solid #2563eb", paddingBottom: "3mm" }}>
            {escola}
          </div>
        )}

        {(professor || turma) && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", marginBottom: "4mm", color: "#475569" }}>
            {professor && <span><strong>Professor(a):</strong> {professor}</span>}
            {turma && <span><strong>Turma:</strong> {turma}</span>}
          </div>
        )}

        {blocks.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: "10pt" }}>
            Adicione elementos à atividade usando o painel esquerdo
          </div>
        )}

        {(() => {
          const rendered: JSX.Element[] = [];
          let questionCounter = 0;
          let alternatingIdx = 0;
          let i = 0;

          while (i < blocks.length) {
            const block = blocks[i];
            const align = block.alignment || "left";

            const resolveFloat = (imgBlock: Block) => {
              const f = imgBlock.imageFloat || "none";
              if (f === "alternating") {
                alternatingIdx++;
                return alternatingIdx % 2 === 1 ? "left" : "right";
              }
              return f;
            };

            // Image + adjacent text pairing
            if (block.type === "image" && block.imageUrl && block.imageFloat !== "none") {
              const size = imageSizeMap[block.imageSize || "medium"];
              const float = resolveFloat(block);
              const nextBlock = i + 1 < blocks.length ? blocks[i + 1] : null;
              if (nextBlock && nextBlock.type === "text") {
                rendered.push(
                  <div key={block.id} style={{ display: "flex", gap: "5mm", marginBottom: "4mm", alignItems: "flex-start", flexDirection: float === "right" ? "row-reverse" : "row", pageBreakInside: "avoid" }}>
                    <img src={block.imageUrl} alt="" style={{ width: size, maxHeight: "80mm", objectFit: "contain", borderRadius: "2mm", flexShrink: 0 }} />
                    <div style={{ flex: 1, textAlign: "justify", textIndent: "10mm" }} dangerouslySetInnerHTML={{ __html: renderKaTeX(nextBlock.content || "Texto") }} />
                  </div>
                );
                i += 2;
                continue;
              }
              rendered.push(
                <div key={block.id} style={{ marginBottom: "4mm", textAlign: float === "right" ? "right" : "left", pageBreakInside: "avoid" }}>
                  <img src={block.imageUrl} alt="" style={{ width: size, maxHeight: "80mm", objectFit: "contain", borderRadius: "2mm" }} />
                </div>
              );
              i++;
              continue;
            }

            // Text + next floating image pairing
            if (block.type === "text") {
              const nextBlock = i + 1 < blocks.length ? blocks[i + 1] : null;
              if (nextBlock && nextBlock.type === "image" && nextBlock.imageUrl && nextBlock.imageFloat !== "none") {
                const size = imageSizeMap[nextBlock.imageSize || "medium"];
                const float = resolveFloat(nextBlock);
                rendered.push(
                  <div key={block.id} style={{ display: "flex", gap: "5mm", marginBottom: "4mm", alignItems: "flex-start", flexDirection: float === "right" ? "row-reverse" : "row", pageBreakInside: "avoid" }}>
                    <img src={nextBlock.imageUrl} alt="" style={{ width: size, maxHeight: "80mm", objectFit: "contain", borderRadius: "2mm", flexShrink: 0 }} />
                    <div style={{ flex: 1, textAlign: "justify", textIndent: "10mm" }} dangerouslySetInnerHTML={{ __html: renderKaTeX(block.content || "Texto") }} />
                  </div>
                );
                i += 2;
                continue;
              }
            }

            if (block.type === "title") {
              rendered.push(
                <h1 key={block.id} style={{ textAlign: align, fontSize: "16pt", fontWeight: 700, fontFamily: "'Montserrat', sans-serif", marginBottom: "6mm", borderBottom: "1px solid #e2e8f0", paddingBottom: "3mm" }}>
                  {block.content || "Título da Atividade"}
                </h1>
              );
            } else if (block.type === "separator") {
              rendered.push(
                <h2 key={block.id} style={{ textAlign: align, fontSize: "13pt", fontWeight: 700, fontFamily: "'Montserrat', sans-serif", marginTop: "8mm", marginBottom: "5mm", borderBottom: "1.5px solid #94a3b8", paddingBottom: "2mm", color: "#1e293b", pageBreakAfter: "avoid" }}>
                  {block.content || "Atividades"}
                </h2>
              );
            } else if (block.type === "text") {
              rendered.push(
                <div key={block.id} style={{ textAlign: "justify", marginBottom: "4mm", textIndent: "10mm" }} dangerouslySetInnerHTML={{ __html: renderKaTeX(block.content || "Texto do bloco") }} />
              );
            } else if (block.type === "question-open") {
              questionCounter++;
              const num = autoNumber ? questionCounter : "";
              rendered.push(
                <div key={block.id} style={{ marginBottom: "6mm", pageBreakInside: "avoid" }}>
                  {block.questionImageUrl && (
                    <div style={{ marginBottom: "3mm", textAlign: "center" }}>
                      <img src={block.questionImageUrl} alt="" style={{ maxWidth: "60%", maxHeight: "50mm", objectFit: "contain", borderRadius: "2mm" }} />
                    </div>
                  )}
                  <p style={{ fontWeight: 600, marginBottom: "2mm", textAlign: "justify" }}>
                    <span dangerouslySetInnerHTML={{ __html: `${num ? num + ") " : ""}${renderKaTeX(block.content || "Enunciado da questão")}` }} />
                  </p>
                  {Array.from({ length: block.lines || 4 }).map((_, li) => (
                    <div key={li} style={{ borderBottom: "1px solid #d1d5db", height: "8mm", marginBottom: "1mm" }} />
                  ))}
                </div>
              );
            } else if (block.type === "question-mc") {
              questionCounter++;
              const num = autoNumber ? questionCounter : "";
              rendered.push(
                <div key={block.id} style={{ marginBottom: "6mm", pageBreakInside: "avoid" }}>
                  {block.questionImageUrl && (
                    <div style={{ marginBottom: "3mm", textAlign: "center" }}>
                      <img src={block.questionImageUrl} alt="" style={{ maxWidth: "60%", maxHeight: "50mm", objectFit: "contain", borderRadius: "2mm" }} />
                    </div>
                  )}
                  <p style={{ fontWeight: 600, marginBottom: "2mm", textAlign: "justify" }}>
                    <span dangerouslySetInnerHTML={{ __html: `${num ? num + ") " : ""}${renderKaTeX(block.content || "Enunciado")}` }} />
                  </p>
                  {block.alternatives?.map((alt, ai) => (
                    <p key={ai} style={{ marginLeft: "5mm", marginBottom: "1mm" }}>
                      <span style={{ fontWeight: 600 }}>{String.fromCharCode(65 + ai)})</span>{" "}
                      <span dangerouslySetInnerHTML={{ __html: renderKaTeX(alt || `Alternativa ${String.fromCharCode(65 + ai)}`) }} />
                    </p>
                  ))}
                </div>
              );
            } else if (block.type === "question-enem") {
              questionCounter++;
              const num = autoNumber ? questionCounter : "";
              rendered.push(
                <div key={block.id} style={{ marginBottom: "8mm", pageBreakInside: "avoid" }}>
                  {/* ENEM Texto Base */}
                  {block.textoBase && (
                    <div style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "2mm",
                      padding: "3mm 4mm",
                      marginBottom: "3mm",
                      backgroundColor: "#f8fafc",
                      fontSize: "10pt",
                      lineHeight: 1.5,
                    }}>
                      <div style={{ textAlign: "justify" }} dangerouslySetInnerHTML={{ __html: renderKaTeX(block.textoBase) }} />
                      {block.fonte && (
                        <p style={{ textAlign: "right", fontSize: "8pt", color: "#64748b", marginTop: "2mm", fontStyle: "italic" }}>
                          {block.fonte}
                        </p>
                      )}
                    </div>
                  )}
                  {/* Question image */}
                  {block.questionImageUrl && (
                    <div style={{ marginBottom: "3mm", textAlign: "center" }}>
                      <img src={block.questionImageUrl} alt="" style={{ maxWidth: "70%", maxHeight: "60mm", objectFit: "contain", borderRadius: "2mm", border: "1px solid #e2e8f0" }} />
                    </div>
                  )}
                  {/* Enunciado/Comando */}
                  <p style={{ fontWeight: 600, marginBottom: "3mm", textAlign: "justify" }}>
                    <span dangerouslySetInnerHTML={{ __html: `${num ? `<strong>QUESTÃO ${num}</strong> — ` : ""}${renderKaTeX(block.content || "Enunciado da questão")}` }} />
                  </p>
                  {/* 5 alternatives A-E */}
                  {block.alternatives?.map((alt, ai) => (
                    <p key={ai} style={{ marginLeft: "5mm", marginBottom: "1.5mm", lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 700, marginRight: "2mm" }}>({String.fromCharCode(65 + ai)})</span>
                      <span dangerouslySetInnerHTML={{ __html: renderKaTeX(alt || `Alternativa ${String.fromCharCode(65 + ai)}`) }} />
                    </p>
                  ))}
                </div>
              );
            } else if (block.type === "image" && block.imageUrl) {
              const size = imageSizeMap[block.imageSize || "medium"];
              rendered.push(
                <div key={block.id} style={{ textAlign: align, marginBottom: "4mm", pageBreakInside: "avoid" }}>
                  <img src={block.imageUrl} alt="" style={{ maxWidth: size, maxHeight: "80mm", display: "inline-block", objectFit: "contain", borderRadius: "2mm" }} />
                </div>
              );
            }

            i++;
          }
          return rendered;
        })()}
      </div>
    </div>
  );
}
