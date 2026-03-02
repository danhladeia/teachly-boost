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
  let questionCounter = 0;

  return (
    <div className="bg-muted/30 rounded-lg p-4 flex justify-center">
      <div
        id="atividade-print-area"
        ref={containerRef}
        className="bg-white text-black shadow-lg"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "15mm",
          fontFamily: "'Inter', 'Arial', sans-serif",
          fontSize: "11pt",
          lineHeight: 1.6,
        }}
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
          let i = 0;
          while (i < blocks.length) {
            const block = blocks[i];
            const align = block.alignment || "left";

            // Check if next block is an image (or current is image followed by text) — pair them in flexbox
            if (block.type === "image" && block.imageUrl && block.imageFloat !== "none") {
              const size = imageSizeMap[block.imageSize || "medium"];
              const float = block.imageFloat || "left";
              // Look ahead for the next text block to pair with
              const nextBlock = i + 1 < blocks.length ? blocks[i + 1] : null;
              if (nextBlock && nextBlock.type === "text") {
                rendered.push(
                  <div key={block.id} style={{ display: "flex", gap: "5mm", marginBottom: "4mm", alignItems: "flex-start", flexDirection: float === "right" ? "row-reverse" : "row" }}>
                    <img src={block.imageUrl} alt="" style={{ width: size, maxHeight: "80mm", objectFit: "contain", borderRadius: "2mm", flexShrink: 0 }} />
                    <div style={{ flex: 1, textAlign: "justify", textIndent: "10mm" }} dangerouslySetInnerHTML={{ __html: renderKaTeX(nextBlock.content || "Texto") }} />
                  </div>
                );
                i += 2;
                continue;
              }
              // Image alone (no adjacent text)
              rendered.push(
                <div key={block.id} style={{ marginBottom: "4mm", textAlign: float === "right" ? "right" : "left" }}>
                  <img src={block.imageUrl} alt="" style={{ width: size, maxHeight: "80mm", objectFit: "contain", borderRadius: "2mm" }} />
                </div>
              );
              i++;
              continue;
            }

            // Check if current is text and NEXT is a floating image — pair them
            if (block.type === "text") {
              const nextBlock = i + 1 < blocks.length ? blocks[i + 1] : null;
              if (nextBlock && nextBlock.type === "image" && nextBlock.imageUrl && nextBlock.imageFloat !== "none") {
                const size = imageSizeMap[nextBlock.imageSize || "medium"];
                const float = nextBlock.imageFloat || "left";
                rendered.push(
                  <div key={block.id} style={{ display: "flex", gap: "5mm", marginBottom: "4mm", alignItems: "flex-start", flexDirection: float === "right" ? "row-reverse" : "row" }}>
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
            } else if (block.type === "text") {
              rendered.push(
                <div key={block.id} style={{ textAlign: "justify", marginBottom: "4mm", textIndent: "10mm" }} dangerouslySetInnerHTML={{ __html: renderKaTeX(block.content || "Texto do bloco") }} />
              );
            } else if (block.type === "question-open") {
              questionCounter++;
              const num = autoNumber ? questionCounter : "";
              rendered.push(
                <div key={block.id} style={{ marginBottom: "6mm" }}>
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
                <div key={block.id} style={{ marginBottom: "6mm" }}>
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
            } else if (block.type === "image" && block.imageUrl) {
              const size = imageSizeMap[block.imageSize || "medium"];
              rendered.push(
                <div key={block.id} style={{ textAlign: align, marginBottom: "4mm" }}>
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
