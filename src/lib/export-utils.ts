import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from "docx";

async function fetchImageAsBuffer(url: string): Promise<{ buffer: ArrayBuffer; width: number; height: number } | null> {
  try {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      setTimeout(() => reject(), 8000);
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/png"));
    if (!blob) return null;
    const buffer = await blob.arrayBuffer();
    return { buffer, width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    return null;
  }
}

function fitImage(origW: number, origH: number, maxW: number, maxH: number) {
  let w = origW, h = origH;
  if (w > maxW) { h = h * (maxW / w); w = maxW; }
  if (h > maxH) { w = w * (maxH / h); h = maxH; }
  return { width: Math.round(w), height: Math.round(h) };
}

export async function exportToPdf(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const directChildren = Array.from(element.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
  const isPaginatedA4 = directChildren.some((el) => el.style.height.includes("297mm"));

  // Special handling for paginated A4 previews (atividades)
  // Renders each page independently via html2canvas → jsPDF to avoid blank pages
  // caused by floating-point rounding when html2pdf splits a 297mm-tall div.
  if (isPaginatedA4) {
    const pageEls = directChildren.filter((el) => el.style.height.includes("297mm"));
    if (pageEls.length === 0) return;

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

    for (let i = 0; i < pageEls.length; i++) {
      const el = pageEls[i];

      // Temporarily strip decorative styles that shouldn't appear in PDF
      const origBoxShadow = el.style.boxShadow;
      const origMargin = el.style.margin;
      const origTransform = el.style.transform;
      el.style.boxShadow = "none";
      el.style.margin = "0";
      el.style.transform = "none";

      // Also clear any scaling on the parent container
      const origContainerTransform = element.style.transform;
      element.style.transform = "none";

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        // Force exact A4 pixel dimensions at 96 dpi to avoid overflow bleed
        width: 794,
        height: 1123,
        windowWidth: 794,
        logging: false,
      });

      // Restore styles
      el.style.boxShadow = origBoxShadow;
      el.style.margin = origMargin;
      el.style.transform = origTransform;
      element.style.transform = origContainerTransform;

      if (i > 0) pdf.addPage();
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      // Fill exactly the A4 page — no margins — so no gap/blank appears
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
    }

    pdf.save(`${filename}.pdf`);
    return;
  }

  // Generic handling for non-paginated previews (planos, provas, etc.)
  const origPadding = element.style.padding;
  const origWidth = element.style.width;
  const origMinHeight = element.style.minHeight;
  const origBoxShadow = element.style.boxShadow;

  // Temporarily normalize: remove internal padding and constrain width to
  // A4 minus margins so html2pdf doesn't double-count padding.
  element.style.padding = "0";
  element.style.width = "180mm"; // 210mm - 15mm*2
  element.style.minHeight = "auto";
  element.style.boxShadow = "none";

  await html2pdf()
    .set({
      margin: [15, 15, 15, 15],
      filename: `${filename}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, width: element.scrollWidth },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"], avoid: [".question"] },
    })
    .from(element)
    .save();

  element.style.padding = origPadding;
  element.style.width = origWidth;
  element.style.minHeight = origMinHeight;
  element.style.boxShadow = origBoxShadow;
}

export async function exportPlanoToDocx(plano: any, cabecalho?: { escola?: string; logoUrl?: string; bannerUrl?: string }) {
  const children: Paragraph[] = [];

  // Banner or logo image
  if (cabecalho?.logoUrl) {
    const imgData = await fetchImageAsBuffer(cabecalho.logoUrl);
    if (imgData) {
      const isBanner = imgData.width > imgData.height * 2;
      const maxW = isBanner ? 600 : 200;
      const maxH = isBanner ? 120 : 80;
      const { width, height } = fitImage(imgData.width, imgData.height, maxW, maxH);
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: imgData.buffer, transformation: { width, height }, type: "png" })],
        spacing: { after: 200 },
      }));
    }
  }

  if (cabecalho?.escola) {
    children.push(
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: cabecalho.escola, bold: true, size: 28, font: "Arial" })] }),
      new Paragraph({ text: "" })
    );
  }

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "PLANO DE AULA", bold: true, size: 28, font: "Arial" })],
    spacing: { after: 300 },
  }));

  const addSection = (title: string, content: string | string[] | undefined) => {
    if (!content) return;
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: title, bold: true, size: 24, font: "Arial" })] }));
    if (Array.isArray(content)) {
      content.forEach(item => children.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: `• ${item}`, size: 22, font: "Arial" })], spacing: { after: 100 } })));
    } else {
      children.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: content, size: 22, font: "Arial" })], spacing: { after: 200 } }));
    }
  };

  if (plano.identificacao) {
    addSection("Identificação", [
      `Disciplina: ${plano.identificacao.disciplina || ""}`,
      `Nível: ${plano.identificacao.nivel || ""}`,
      `Duração: ${plano.identificacao.duracao || ""}`,
      `Tema: ${plano.identificacao.tema || ""}`,
    ].filter(s => !s.endsWith(": ")));
  }

  if (plano.habilidades_bncc?.length) addSection("Habilidades BNCC", plano.habilidades_bncc.map((h: any) => `${h.codigo}: ${h.descricao}`));
  if (plano.pergunta_norteadora) addSection("Pergunta Norteadora (PBL)", plano.pergunta_norteadora);
  addSection("Objetivos de Aprendizagem", plano.objetivos);
  addSection("Conteúdo Programático", plano.conteudo_programatico);
  addSection("Gancho Inicial", plano.gancho_inicial);
  addSection("Problema / Desafio", plano.problema_desafio);
  addSection("Pesquisa e Exploração", plano.pesquisa_exploracao);
  addSection("Criação e Prototipagem", plano.criacao_prototipagem);
  if (plano.roteiro_sala_invertida) {
    addSection("Atividade Prévia", plano.roteiro_sala_invertida.atividade_previa);
    addSection("Atividade em Sala", plano.roteiro_sala_invertida.atividade_em_sala);
  }
  addSection("Gamificação", plano.gamificacao);
  if (plano.cronograma_aulas?.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Cronograma Aula a Aula", bold: true, size: 24, font: "Arial" })] }));
    plano.cronograma_aulas.forEach((a: any, i: number) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `Aula ${a.aula || i + 1}: ${a.titulo}`, bold: true, size: 22, font: "Arial" })], spacing: { before: 200 } }));
      if (a.atividades) children.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: a.atividades, size: 22, font: "Arial" })] }));
    });
  }
  if (plano.cronograma) addSection("Cronograma", `Introdução: ${plano.cronograma.introducao || ""}\nDesenvolvimento: ${plano.cronograma.desenvolvimento || ""}\nFechamento: ${plano.cronograma.fechamento || ""}`);
  addSection("Resumo da Atividade", plano.resumo_atividade);
  addSection("Desenvolvimento", plano.desenvolvimento);
  addSection("Recursos Necessários", plano.recursos);
  addSection("Diferenciação e Inclusão", plano.diferenciacao);
  addSection("Avaliação", plano.avaliacao);
  addSection("Referências (ABNT)", plano.referencias);

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 850, bottom: 850, left: 850, right: 850 }, // 15mm all sides in twips
        },
      },
      children,
    }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `plano-de-aula.docx`);
}

export async function exportAtividadeToDocx(
  blocks: any[],
  opts?: { escola?: string; professor?: string; turma?: string; autoNumber?: boolean; showLines?: boolean; showAluno?: boolean; showData?: boolean; bannerUrl?: string; logoUrl?: string }
) {
  const children: Paragraph[] = [];
  const includeLines = opts?.showLines !== false; // default true

  // Banner image in DOCX header
  if (opts?.bannerUrl) {
    const imgData = await fetchImageAsBuffer(opts.bannerUrl);
    if (imgData) {
      const { width, height } = fitImage(imgData.width, imgData.height, 600, 120);
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: imgData.buffer, transformation: { width, height }, type: "png" })],
        spacing: { after: 200 },
      }));
    }
  } else if (opts?.logoUrl) {
    const imgData = await fetchImageAsBuffer(opts.logoUrl);
    if (imgData) {
      const { width, height } = fitImage(imgData.width, imgData.height, 200, 80);
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: imgData.buffer, transformation: { width, height }, type: "png" })],
        spacing: { after: 100 },
      }));
    }
  }

  if (opts?.escola) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: opts.escola, bold: true, size: 28, font: "Arial" })] }));
    children.push(new Paragraph({ text: "" }));
  }

  if (opts?.professor || opts?.turma) {
    const parts: string[] = [];
    if (opts.professor) parts.push(`Professor(a): ${opts.professor}`);
    if (opts.turma) parts.push(`Turma: ${opts.turma}`);
    children.push(new Paragraph({ children: [new TextRun({ text: parts.join("   |   "), size: 20, font: "Arial" })], spacing: { after: 100 } }));
  }

  // Aluno and Data fields
  if (opts?.showAluno || opts?.showData) {
    const parts: TextRun[] = [];
    if (opts.showAluno) parts.push(new TextRun({ text: "Aluno(a): ________________________________________", size: 20, font: "Arial" }));
    if (opts.showAluno && opts.showData) parts.push(new TextRun({ text: "     ", size: 20, font: "Arial" }));
    if (opts.showData) parts.push(new TextRun({ text: "Data: ____/____/________", size: 20, font: "Arial" }));
    children.push(new Paragraph({ children: parts, spacing: { after: 200 } }));
  }

  let qNum = 0;
  for (const block of blocks) {
    // Handle image blocks
    if (block.type === "image" && block.imageUrl) {
      const imgData = await fetchImageAsBuffer(block.imageUrl);
      if (imgData) {
        const maxW = block.imageSize === "small" ? 200 : block.imageSize === "large" ? 500 : 350;
        const { width, height } = fitImage(imgData.width, imgData.height, maxW, 300);
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({ data: imgData.buffer, transformation: { width, height }, type: "png" })],
          spacing: { before: 100, after: 200 },
        }));
      }
      continue;
    }

    if (block.type === "title") {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: block.content || "Título", bold: true, size: 28, font: "Arial" })],
        spacing: { after: 300 },
      }));
    } else if (block.type === "separator") {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: block.content || "Atividades", bold: true, size: 24, font: "Arial" })],
        spacing: { before: 300, after: 200 },
      }));
    } else if (block.type === "text") {
      children.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: block.content || "", size: 22, font: "Arial" })],
        spacing: { after: 200 },
      }));
    } else if (block.type === "question-open" || block.type === "question-enem") {
      qNum++;
      const prefix = opts?.autoNumber ? `${qNum}) ` : "";

      // ENEM text base
      if (block.type === "question-enem" && block.textoBase) {
        children.push(new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun({ text: block.textoBase, size: 20, font: "Arial", italics: true })],
          spacing: { before: 200, after: 100 },
        }));
        if (block.fonte) {
          children.push(new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: block.fonte, size: 16, font: "Arial", italics: true, color: "64748b" })],
            spacing: { after: 100 },
          }));
        }
      }

      // Question image
      if (block.questionImageUrl) {
        const imgData = await fetchImageAsBuffer(block.questionImageUrl);
        if (imgData) {
          const { width, height } = fitImage(imgData.width, imgData.height, 350, 250);
          children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new ImageRun({ data: imgData.buffer, transformation: { width, height }, type: "png" })],
            spacing: { before: 100, after: 100 },
          }));
        }
      }

      children.push(new Paragraph({
        children: [new TextRun({ text: `${prefix}${block.content || "Questão"}`, bold: true, size: 22, font: "Arial" })],
        spacing: { before: 200, after: 100 },
      }));

      // ENEM alternatives
      if (block.type === "question-enem" && block.alternatives?.length) {
        block.alternatives.forEach((alt: string, ai: number) => {
          children.push(new Paragraph({
            children: [new TextRun({ text: `(${String.fromCharCode(65 + ai)}) ${alt || ""}`, size: 22, font: "Arial" })],
            spacing: { after: 50 },
          }));
        });
      } else if (includeLines) {
        // Open question lines
        for (let i = 0; i < (block.lines || 4); i++) {
          children.push(new Paragraph({ children: [new TextRun({ text: "________________________________________", size: 22, font: "Arial", color: "999999" })], spacing: { after: 50 } }));
        }
      }
    } else if (block.type === "question-mc") {
      qNum++;
      const prefix = opts?.autoNumber ? `${qNum}) ` : "";

      // Question image
      if (block.questionImageUrl) {
        const imgData = await fetchImageAsBuffer(block.questionImageUrl);
        if (imgData) {
          const { width, height } = fitImage(imgData.width, imgData.height, 350, 250);
          children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new ImageRun({ data: imgData.buffer, transformation: { width, height }, type: "png" })],
            spacing: { before: 100, after: 100 },
          }));
        }
      }

      children.push(new Paragraph({
        children: [new TextRun({ text: `${prefix}${block.content || "Questão"}`, bold: true, size: 22, font: "Arial" })],
        spacing: { before: 200, after: 100 },
      }));
      block.alternatives?.forEach((alt: string, ai: number) => {
        children.push(new Paragraph({
          children: [new TextRun({ text: `${String.fromCharCode(65 + ai)}) ${alt || ""}`, size: 22, font: "Arial" })],
          spacing: { after: 50 },
        }));
      });
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 850, bottom: 850, left: 850, right: 850 }, // 15mm all sides
        },
      },
      children,
    }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, "atividade.docx");
}

export async function exportExamToDocx(
  questoes: any[],
  opts?: { titulo?: string; escola?: string; professor?: string; turma?: string; bannerUrl?: string; logoUrl?: string }
) {
  const children: Paragraph[] = [];

  // Banner/logo
  if (opts?.bannerUrl) {
    const imgData = await fetchImageAsBuffer(opts.bannerUrl);
    if (imgData) {
      const { width, height } = fitImage(imgData.width, imgData.height, 600, 120);
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: imgData.buffer, transformation: { width, height }, type: "png" })],
        spacing: { after: 200 },
      }));
    }
  } else if (opts?.logoUrl) {
    const imgData = await fetchImageAsBuffer(opts.logoUrl);
    if (imgData) {
      const { width, height } = fitImage(imgData.width, imgData.height, 200, 80);
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: imgData.buffer, transformation: { width, height }, type: "png" })],
        spacing: { after: 100 },
      }));
    }
  }

  if (opts?.escola) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: opts.escola, bold: true, size: 28, font: "Arial" })] }));
    children.push(new Paragraph({ text: "" }));
  }

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: opts?.titulo || "Prova", bold: true, size: 28, font: "Arial" })],
    spacing: { after: 200 },
  }));

  if (opts?.professor || opts?.turma) {
    const parts: string[] = [];
    if (opts.professor) parts.push(`Professor(a): ${opts.professor}`);
    if (opts.turma) parts.push(`Turma: ${opts.turma}`);
    children.push(new Paragraph({ children: [new TextRun({ text: parts.join("   |   "), size: 20, font: "Arial" })], spacing: { after: 100 } }));
  }

  children.push(new Paragraph({ children: [new TextRun({ text: "Nome: ________________________________________   Data: ___/___/___   Nota: _____", size: 20, font: "Arial" })], spacing: { after: 300 } }));

  for (let idx = 0; idx < questoes.length; idx++) {
    const q = questoes[idx];

    // Question image
    if (q.imageUrl) {
      const imgData = await fetchImageAsBuffer(q.imageUrl);
      if (imgData) {
        const { width, height } = fitImage(imgData.width, imgData.height, 350, 250);
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({ data: imgData.buffer, transformation: { width, height }, type: "png" })],
          spacing: { before: 100, after: 100 },
        }));
      }
    }

    children.push(new Paragraph({
      children: [new TextRun({ text: `${idx + 1}) ${q.content || "Questão"}`, bold: true, size: 22, font: "Arial" })],
      spacing: { before: 200, after: 100 },
    }));

    if (q.type === "mc" && q.alternatives?.length) {
      q.alternatives.forEach((alt: string, ai: number) => {
        children.push(new Paragraph({
          children: [new TextRun({ text: `${String.fromCharCode(65 + ai)}) ${alt || ""}`, size: 22, font: "Arial" })],
          spacing: { after: 50 },
        }));
      });
    } else if (q.type === "open") {
      for (let i = 0; i < (q.lines || 4); i++) {
        children.push(new Paragraph({ children: [new TextRun({ text: "________________________________________", size: 22, font: "Arial", color: "999999" })], spacing: { after: 50 } }));
      }
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 850, bottom: 850, left: 850, right: 850 },
        },
      },
      children,
    }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${opts?.titulo || "prova"}.docx`);
}
