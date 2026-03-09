import { useEffect, useRef, useState, useCallback } from "react";
import type { Block } from "./types";

interface A4PreviewProps {
  blocks: Block[];
  showHeader: boolean;
  escola: string;
  autoNumber: boolean;
  showLines?: boolean;
  showAluno?: boolean;
  showData?: boolean;
  professor?: string;
  turma?: string;
  logoUrl?: string;
  bannerUrl?: string;
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

// A4 = 210mm x 297mm. Padding 20mm top/bottom, 15mm left/right.
// Content height per page = 297 - 40 = 257mm
const PAGE_WIDTH = "210mm";
const PAGE_HEIGHT_MM = 297;
const PADDING_TOP_MM = 15;
const PADDING_BOTTOM_MM = 15;
const PADDING_LR = "15mm";
const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - PADDING_TOP_MM - PADDING_BOTTOM_MM; // 267mm

const baseFontStyle: React.CSSProperties = {
  fontFamily: "'Inter', 'Arial', sans-serif",
  fontSize: "11pt",
  lineHeight: 1.6,
  color: "#000",
  wordBreak: "break-word",
  overflowWrap: "break-word",
};

export default function A4Preview({ blocks, showHeader, escola, autoNumber, showLines = true, showAluno = false, showData = false, professor, turma, logoUrl, bannerUrl }: A4PreviewProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number[][]>([]); // array of arrays of child indices per page

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

  // Build rendered elements
  const buildRendered = useCallback(() => {
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

      if (block.type === "image" && block.imageUrl && block.imageFloat !== "none") {
        const size = imageSizeMap[block.imageSize || "medium"];
        const float = resolveFloat(block);
        const nextBlock = i + 1 < blocks.length ? blocks[i + 1] : null;
        if (nextBlock && nextBlock.type === "text") {
          rendered.push(
            <div key={block.id} data-block-id={block.id} style={{ display: "flex", gap: "5mm", marginBottom: "4mm", alignItems: "flex-start", flexDirection: float === "right" ? "row-reverse" : "row" }}>
              <img src={block.imageUrl} alt="" style={{ width: size, maxHeight: "80mm", objectFit: "contain", borderRadius: "2mm", flexShrink: 0 }} />
              <div style={{ flex: 1, textAlign: "justify", textIndent: "10mm" }} dangerouslySetInnerHTML={{ __html: renderKaTeX(nextBlock.content || "Texto") }} />
            </div>
          );
          i += 2; continue;
        }
        rendered.push(
          <div key={block.id} data-block-id={block.id} style={{ marginBottom: "4mm", textAlign: float === "right" ? "right" : "left" }}>
            <img src={block.imageUrl} alt="" style={{ width: size, maxHeight: "80mm", objectFit: "contain", borderRadius: "2mm" }} />
          </div>
        );
        i++; continue;
      }

      if (block.type === "text") {
        const nextBlock = i + 1 < blocks.length ? blocks[i + 1] : null;
        if (nextBlock && nextBlock.type === "image" && nextBlock.imageUrl && nextBlock.imageFloat !== "none") {
          const size = imageSizeMap[nextBlock.imageSize || "medium"];
          const float = resolveFloat(nextBlock);
          rendered.push(
            <div key={block.id} data-block-id={block.id} style={{ display: "flex", gap: "5mm", marginBottom: "4mm", alignItems: "flex-start", flexDirection: float === "right" ? "row-reverse" : "row" }}>
              <img src={nextBlock.imageUrl} alt="" style={{ width: size, maxHeight: "80mm", objectFit: "contain", borderRadius: "2mm", flexShrink: 0 }} />
              <div style={{ flex: 1, textAlign: "justify", textIndent: "10mm" }} dangerouslySetInnerHTML={{ __html: renderKaTeX(block.content || "Texto") }} />
            </div>
          );
          i += 2; continue;
        }
      }

      if (block.type === "title") {
        rendered.push(
          <h1 key={block.id} data-block-id={block.id} style={{ textAlign: align, fontSize: "16pt", fontWeight: 700, fontFamily: "'Montserrat', sans-serif", marginBottom: "6mm", borderBottom: "1px solid #e2e8f0", paddingBottom: "3mm" }}>
            {block.content || "Título da Atividade"}
          </h1>
        );
      } else if (block.type === "separator") {
        rendered.push(
          <h2 key={block.id} data-block-id={block.id} style={{ textAlign: align, fontSize: "13pt", fontWeight: 700, fontFamily: "'Montserrat', sans-serif", marginTop: "8mm", marginBottom: "5mm", borderBottom: "1.5px solid #94a3b8", paddingBottom: "2mm", color: "#1e293b" }}>
            {block.content || "Atividades"}
          </h2>
        );
      } else if (block.type === "text") {
        rendered.push(
          <div key={block.id} data-block-id={block.id} style={{ textAlign: "justify", marginBottom: "4mm", textIndent: "10mm" }} dangerouslySetInnerHTML={{ __html: renderKaTeX(block.content || "Texto do bloco") }} />
        );
      } else if (block.type === "question-open") {
        questionCounter++;
        const num = autoNumber ? questionCounter : "";
        rendered.push(
          <div key={block.id} data-block-id={block.id} style={{ marginBottom: "6mm" }}>
            {block.questionImageUrl && (
              <div style={{ marginBottom: "3mm", textAlign: "center" }}>
                <img src={block.questionImageUrl} alt="" style={{ maxWidth: "60%", maxHeight: "50mm", objectFit: "contain", borderRadius: "2mm" }} />
              </div>
            )}
            <p style={{ fontWeight: 600, marginBottom: "2mm", textAlign: "justify" }}>
              <span dangerouslySetInnerHTML={{ __html: `${num ? num + ") " : ""}${renderKaTeX(block.content || "Enunciado da questão")}` }} />
            </p>
            {showLines && Array.from({ length: block.lines || 4 }).map((_, li) => (
              <div key={li} style={{ borderBottom: "1px solid #d1d5db", height: "8mm", marginBottom: "1mm" }} />
            ))}
          </div>
        );
      } else if (block.type === "question-mc") {
        questionCounter++;
        const num = autoNumber ? questionCounter : "";
        rendered.push(
          <div key={block.id} data-block-id={block.id} style={{ marginBottom: "6mm" }}>
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
          <div key={block.id} data-block-id={block.id} style={{ marginBottom: "8mm" }}>
            {block.textoBase && (
              <div style={{ border: "1px solid #cbd5e1", borderRadius: "2mm", padding: "3mm 4mm", marginBottom: "3mm", backgroundColor: "#f8fafc", fontSize: "10pt", lineHeight: 1.5 }}>
                <div style={{ textAlign: "justify" }} dangerouslySetInnerHTML={{ __html: renderKaTeX(block.textoBase) }} />
                {block.fonte && <p style={{ textAlign: "right", fontSize: "8pt", color: "#64748b", marginTop: "2mm", fontStyle: "italic" }}>{block.fonte}</p>}
              </div>
            )}
            {block.questionImageUrl && (
              <div style={{ marginBottom: "3mm", textAlign: "center" }}>
                <img src={block.questionImageUrl} alt="" style={{ maxWidth: "70%", maxHeight: "60mm", objectFit: "contain", borderRadius: "2mm", border: "1px solid #e2e8f0" }} />
              </div>
            )}
            <p style={{ fontWeight: 600, marginBottom: "3mm", textAlign: "justify" }}>
              <span dangerouslySetInnerHTML={{ __html: `${num ? `<strong>QUESTÃO ${num}</strong> — ` : ""}${renderKaTeX(block.content || "Enunciado da questão")}` }} />
            </p>
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
          <div key={block.id} data-block-id={block.id} style={{ textAlign: align, marginBottom: "4mm" }}>
            <img src={block.imageUrl} alt="" style={{ maxWidth: size, maxHeight: "80mm", display: "inline-block", objectFit: "contain", borderRadius: "2mm" }} />
          </div>
        );
      }

      i++;
    }
    return rendered;
  }, [blocks, autoNumber]);

  const renderedBlocks = buildRendered();

  // Stable key for pagination dependency — avoids infinite re-renders
  const blocksKey = blocks.map(b => `${b.id}:${b.type}:${(b.content || "").length}:${(b.alternatives || []).length}:${b.lines || 0}:${b.imageUrl || ""}:${b.questionImageUrl || ""}`).join("|");

  // After rendering in the hidden measure container, paginate
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!measureRef.current) return;
      const container = measureRef.current;
      const children = Array.from(container.children) as HTMLElement[];
      if (children.length === 0) { setPages([]); return; }

      // Convert mm to px using the container's actual rendered width
      const containerWidth = container.getBoundingClientRect().width;
      // 210mm = containerWidth px, so 1mm = containerWidth/210 px
      const pxPerMm = containerWidth / 210;
      const maxContentHeight = CONTENT_HEIGHT_MM * pxPerMm;

      // Find header elements (before block content)
      const headerEls: HTMLElement[] = [];
      const blockEls: HTMLElement[] = [];
      for (const child of children) {
        if (child.dataset.blockId) {
          blockEls.push(child);
        } else {
          headerEls.push(child);
        }
      }

      // Measure header height
      let headerHeight = 0;
      for (const el of headerEls) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        headerHeight += rect.height + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
      }

      // Paginate block elements
      const pagesList: number[][] = [];
      let currentPage: number[] = [];
      let currentHeight = headerHeight; // first page includes header

      for (let idx = 0; idx < blockEls.length; idx++) {
        const el = blockEls[idx];
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const elHeight = rect.height + parseFloat(style.marginTop || "0") + parseFloat(style.marginBottom || "0");

        if (currentPage.length > 0 && currentHeight + elHeight > maxContentHeight) {
          // Start new page
          pagesList.push(currentPage);
          currentPage = [idx];
          currentHeight = elHeight;
        } else {
          currentPage.push(idx);
          currentHeight += elHeight;
        }
      }
      if (currentPage.length > 0) pagesList.push(currentPage);

      setPages(pagesList);

      const totalPages = pagesList.length;
      console.log(`[A4Preview] Atividade paginada: ${totalPages} página(s), ${blockEls.length} blocos`);
      pagesList.forEach((p, i) => console.log(`  Página ${i + 1}: ${p.length} blocos`));
    }, 150); // wait for images/katex to load

    return () => clearTimeout(timer);
  }, [blocksKey, showHeader, showLines, showAluno, showData, escola, professor, turma, bannerUrl, logoUrl]);

  // Separate header and block elements from rendered
  const headerElements: JSX.Element[] = [];
  const blockElements = renderedBlocks;

  // Build header JSX
  const headerJSX = (
    <>
      {showHeader && bannerUrl && (
        <div style={{ textAlign: "center", marginBottom: "4mm" }}>
          <img src={bannerUrl} alt="Timbre da escola" style={{ maxWidth: "100%", maxHeight: "25mm", objectFit: "contain" }} crossOrigin="anonymous" />
        </div>
      )}
      {showHeader && (escola || logoUrl) && (
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: "14pt", marginBottom: "4mm", fontFamily: "'Montserrat', sans-serif", borderBottom: "2px solid #2563eb", paddingBottom: "3mm", display: "flex", alignItems: "center", justifyContent: "center", gap: "3mm" }}>
          {logoUrl && !bannerUrl && (
            <img src={logoUrl} alt="" style={{ maxHeight: "12mm", objectFit: "contain" }} crossOrigin="anonymous" />
          )}
          {escola && <span>{escola}</span>}
        </div>
      )}
      {(professor || turma) && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", marginBottom: "2mm", color: "#475569" }}>
          {professor && <span><strong>Professor(a):</strong> {professor}</span>}
          {turma && <span><strong>Turma:</strong> {turma}</span>}
        </div>
      )}
      {(showAluno || showData) && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10pt", marginBottom: "4mm", gap: "4mm", borderBottom: "1px solid #e2e8f0", paddingBottom: "3mm" }}>
          {showAluno && <span><strong>Aluno(a):</strong> ________________________________________</span>}
          {showData && <span><strong>Data:</strong> ____/____/________</span>}
        </div>
      )}
    </>
  );

  const pageStyle: React.CSSProperties = {
    width: PAGE_WIDTH,
    height: `${PAGE_HEIGHT_MM}mm`,
    padding: `${PADDING_TOP_MM}mm ${PADDING_LR} ${PADDING_BOTTOM_MM}mm ${PADDING_LR}`,
    ...baseFontStyle,
    background: "#fff",
    boxSizing: "border-box",
    overflow: "hidden",
    position: "relative",
  };

  return (
    <div className="bg-muted/30 rounded-lg p-2 sm:p-4 flex flex-col items-center gap-6 w-full overflow-hidden">
      {/* Hidden measurement container - renders everything flat to measure heights */}
      <div
        ref={measureRef}
        style={{
          ...baseFontStyle,
          width: PAGE_WIDTH,
          padding: `0 ${PADDING_LR}`,
          position: "absolute",
          visibility: "hidden",
          left: "-9999px",
          background: "#fff",
        }}
      >
        {headerJSX}
        {blockElements}
      </div>

      {/* Visible paginated output for on-screen preview */}
      {pages.length > 0 ? (
        <div id="atividade-print-area" className="flex flex-col items-center gap-6">
          {pages.map((pageBlockIndices, pageIdx) => (
            <div
              key={pageIdx}
              className="bg-white text-black shadow-lg"
              style={pageStyle}
            >
              {pageIdx === 0 && headerJSX}
              {pageBlockIndices.map(blockIdx => blockElements[blockIdx])}
            </div>
          ))}
        </div>
      ) : (
        /* Fallback: single page before measurement completes */
        <div
          id="atividade-print-area"
          className="bg-white text-black shadow-lg"
          style={{ ...pageStyle, minHeight: `${PAGE_HEIGHT_MM}mm`, height: "auto" }}
        >
          {headerJSX}
          {blocks.length === 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "#94a3b8", fontSize: "10pt" }}>
              Adicione elementos à atividade usando o painel esquerdo
            </div>
          )}
          {blockElements}
        </div>
      )}
    </div>
  );
}
