import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export async function exportToPdf(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;
  const html2pdf = (await import("html2pdf.js")).default;
  await html2pdf()
    .set({
      margin: 0,
      filename: `${filename}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    })
    .from(element)
    .save();
}

export async function exportPlanoToDocx(plano: any, cabecalho?: { escola?: string; logoUrl?: string }) {
  const children: Paragraph[] = [];

  if (cabecalho?.escola) {
    children.push(
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: cabecalho.escola, bold: true, size: 28, font: "Arial" })] }),
      new Paragraph({ text: "" })
    );
  }

  const addSection = (title: string, content: string | string[] | undefined) => {
    if (!content) return;
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: title, bold: true, size: 24, font: "Arial" })] }));
    if (Array.isArray(content)) {
      content.forEach(item => children.push(new Paragraph({ children: [new TextRun({ text: `• ${item}`, size: 22, font: "Arial" })], spacing: { after: 100 } })));
    } else {
      children.push(new Paragraph({ children: [new TextRun({ text: content, size: 22, font: "Arial" })], spacing: { after: 200 } }));
    }
  };

  if (plano.identificacao) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: `PLANO DE AULA: ${plano.identificacao.tema || ""}`, bold: true, size: 28, font: "Arial" })] }));
    children.push(new Paragraph({ children: [new TextRun({ text: `Disciplina: ${plano.identificacao.disciplina || ""} | Nível: ${plano.identificacao.nivel || ""} | Duração: ${plano.identificacao.duracao || ""}`, size: 20, font: "Arial" })], spacing: { after: 300 } }));
  }

  if (plano.habilidades_bncc?.length) {
    addSection("Habilidades BNCC", plano.habilidades_bncc.map((h: any) => `${h.codigo}: ${h.descricao}`));
  }
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
      if (a.atividades) children.push(new Paragraph({ children: [new TextRun({ text: a.atividades, size: 22, font: "Arial" })] }));
    });
  }

  if (plano.cronograma) {
    addSection("Cronograma", `Introdução: ${plano.cronograma.introducao || ""}\nDesenvolvimento: ${plano.cronograma.desenvolvimento || ""}\nFechamento: ${plano.cronograma.fechamento || ""}`);
  }

  addSection("Resumo da Atividade", plano.resumo_atividade);
  addSection("Desenvolvimento", plano.desenvolvimento);
  addSection("Recursos Necessários", plano.recursos);
  addSection("Diferenciação e Inclusão", plano.diferenciacao);
  addSection("Avaliação", plano.avaliacao);
  addSection("Referências (ABNT)", plano.referencias);

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `plano-de-aula.docx`);
}
