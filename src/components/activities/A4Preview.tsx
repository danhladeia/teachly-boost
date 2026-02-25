import { useEffect, useRef } from "react";
import type { Block } from "./types";

interface A4PreviewProps {
  blocks: Block[];
  showHeader: boolean;
  escola: string;
  autoNumber: boolean;
}

function renderKaTeX(text: string): string {
  // Replace $...$ with KaTeX rendered HTML
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

export default function A4Preview({ blocks, showHeader, escola, autoNumber }: A4PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load KaTeX CSS and JS dynamically
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
          <div style={{ textAlign: "center", fontWeight: 700, fontSize: "14pt", marginBottom: "6mm", fontFamily: "'Montserrat', sans-serif", borderBottom: "2px solid #2563eb", paddingBottom: "3mm" }}>
            {escola}
          </div>
        )}

        {blocks.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: "10pt" }}>
            Adicione elementos à atividade usando o painel esquerdo
          </div>
        )}

        {blocks.map((block) => {
          const align = block.alignment || "left";

          if (block.type === "title") {
            return (
              <h1 key={block.id} style={{ textAlign: align, fontSize: "16pt", fontWeight: 700, fontFamily: "'Montserrat', sans-serif", marginBottom: "6mm", borderBottom: "1px solid #e2e8f0", paddingBottom: "3mm" }}>
                {block.content || "Título da Atividade"}
              </h1>
            );
          }

          if (block.type === "text") {
            return (
              <div
                key={block.id}
                style={{ textAlign: "justify", marginBottom: "4mm", textIndent: align === "left" ? "10mm" : 0 }}
                dangerouslySetInnerHTML={{ __html: renderKaTeX(block.content || "Texto do bloco") }}
              />
            );
          }

          if (block.type === "question-open") {
            questionCounter++;
            const num = autoNumber ? questionCounter : "";
            return (
              <div key={block.id} style={{ marginBottom: "6mm" }}>
                <p style={{ fontWeight: 600, marginBottom: "2mm" }}>
                  <span dangerouslySetInnerHTML={{ __html: `${num ? num + ") " : ""}${renderKaTeX(block.content || "Enunciado da questão")}` }} />
                </p>
                {Array.from({ length: block.lines || 4 }).map((_, li) => (
                  <div key={li} style={{ borderBottom: "1px solid #d1d5db", height: "8mm", marginBottom: "1mm" }} />
                ))}
              </div>
            );
          }

          if (block.type === "question-mc") {
            questionCounter++;
            const num = autoNumber ? questionCounter : "";
            return (
              <div key={block.id} style={{ marginBottom: "6mm" }}>
                <p style={{ fontWeight: 600, marginBottom: "2mm" }}>
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
          }

          if (block.type === "image" && block.imageUrl) {
            const size = imageSizeMap[block.imageSize || "medium"];
            const float = block.imageFloat || "none";

            if (float !== "none") {
              return (
                <div key={block.id} style={{ marginBottom: "4mm", overflow: "hidden" }}>
                  <img
                    src={block.imageUrl}
                    alt=""
                    style={{
                      float: float,
                      width: size,
                      maxHeight: "80mm",
                      objectFit: "contain",
                      margin: float === "left" ? "0 4mm 2mm 0" : "0 0 2mm 4mm",
                      shapeOutside: `url(${block.imageUrl})`,
                    }}
                  />
                </div>
              );
            }

            return (
              <div key={block.id} style={{ textAlign: align, marginBottom: "4mm" }}>
                <img src={block.imageUrl} alt="" style={{ maxWidth: size, maxHeight: "80mm", display: "inline-block", objectFit: "contain" }} />
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
