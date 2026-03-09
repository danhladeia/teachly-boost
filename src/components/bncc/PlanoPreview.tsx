import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FileDown, Printer, Save, Building2 } from "lucide-react";
import { exportToPdf, exportPlanoToDocx } from "@/lib/export-utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlanoPreviewProps {
  plano: any;
  modelo: string;
  professor?: string;
  turma?: string;
  serie?: string;
  escola?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

export default function PlanoPreview({ plano, modelo, professor, turma, serie, escola: escolaProp, logoUrl, bannerUrl }: PlanoPreviewProps) {
  const [showHeader, setShowHeader] = useState(!!escolaProp);
  const [escola, setEscola] = useState(escolaProp || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (escolaProp) {
      setEscola(escolaProp);
      setShowHeader(true);
    } else {
      loadEscola();
    }
  }, [escolaProp]);

  const loadEscola = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("escola").eq("user_id", user.id).single();
      if (data?.escola) { setEscola(data.escola); setShowHeader(true); }
    } catch {}
  };

  const handlePrint = () => {
    const el = document.getElementById("plano-print-area");
    if (!el) return;
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`<html><head><title>Plano de Aula</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; padding: 20mm 15mm; font-size: 11pt; line-height: 1.6; color: #1e293b; }
        h1 { font-size: 16pt; text-align: center; margin-bottom: 8mm; border-bottom: 2px solid #2563eb; padding-bottom: 4mm; }
        h2 { font-size: 13pt; color: #2563eb; margin: 6mm 0 3mm; page-break-after: avoid; }
        p, li { margin-bottom: 2mm; text-align: justify; }
        ul { padding-left: 5mm; }
        .header { text-align: center; margin-bottom: 6mm; font-weight: bold; font-size: 14pt; }
        .section { page-break-inside: avoid; }
        @page { size: A4; margin: 15mm; }
      </style></head><body>`);
    pw.document.write(el.innerHTML);
    pw.document.write("</body></html>");
    pw.document.close();
    pw.focus();
    pw.print();
    pw.close();
  };

  const handleExportPdf = () => exportToPdf("plano-print-area", "plano-de-aula");
  const handleExportDocx = () => exportPlanoToDocx(plano, showHeader ? { escola } : undefined);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login para salvar"); return; }
      const titulo = plano.identificacao?.tema || "Plano de Aula";
      const { error } = await supabase.from("documentos_salvos").insert({
        user_id: user.id, tipo: "plano", titulo,
        conteudo: plano, modelo,
        disciplina: plano.identificacao?.disciplina,
        nivel: plano.identificacao?.nivel,
      });
      if (error) throw error;
      toast.success("Plano salvo na biblioteca!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const justifyStyle: React.CSSProperties = { textAlign: "justify" };

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Switch checked={showHeader} onCheckedChange={setShowHeader} id="header-switch" />
              <Label htmlFor="header-switch" className="text-sm flex items-center gap-1"><Building2 className="h-4 w-4" /> Cabeçalho da Escola</Label>
            </div>
            {showHeader && (
              <Input placeholder="Nome da escola" value={escola} onChange={e => setEscola(e.target.value)} className="max-w-xs h-8 text-sm" />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="mr-1 h-4 w-4" /> Imprimir</Button>
            <Button size="sm" variant="outline" onClick={handleExportPdf}><FileDown className="mr-1 h-4 w-4" /> PDF</Button>
            <Button size="sm" variant="outline" onClick={handleExportDocx}><FileDown className="mr-1 h-4 w-4" /> DOCX</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}><Save className="mr-1 h-4 w-4" /> {saving ? "Salvando..." : "Salvar na Biblioteca"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card overflow-auto">
        <div id="plano-print-area" className="bg-white text-black mx-auto" style={{ width: "210mm", minHeight: "297mm", padding: "15mm 15mm", fontFamily: "'Inter', sans-serif", fontSize: "11pt", lineHeight: 1.6 }}>
          {/* Timbre banner image */}
          {showHeader && bannerUrl && (
            <div style={{ textAlign: "center", marginBottom: "4mm" }}>
              <img src={bannerUrl} alt="Timbre da escola" style={{ maxWidth: "100%", maxHeight: "25mm", objectFit: "contain" }} crossOrigin="anonymous" />
            </div>
          )}
          {showHeader && (escola || logoUrl) && (
            <div style={{ textAlign: "center", marginBottom: "6mm", borderBottom: "2px solid #2563eb", paddingBottom: "3mm", display: "flex", alignItems: "center", justifyContent: "center", gap: "3mm" }}>
              {logoUrl && !bannerUrl && <img src={logoUrl} alt="" style={{ maxHeight: "12mm", objectFit: "contain" }} crossOrigin="anonymous" />}
              {escola && <div style={{ fontWeight: 700, fontSize: "14pt", fontFamily: "'Montserrat', sans-serif" }}>{escola}</div>}
            </div>
          )}

          <h1 style={{ textAlign: "center", fontSize: "16pt", fontWeight: 700, borderBottom: "2px solid #2563eb", paddingBottom: "4mm", marginBottom: "6mm", fontFamily: "'Montserrat', sans-serif" }}>
            PLANO DE AULA
          </h1>

          {plano.identificacao && (
            <PrintSection title="Identificação">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2mm", fontSize: "10pt" }}>
                <p><strong>Disciplina:</strong> {plano.identificacao.disciplina}</p>
                <p><strong>Nível:</strong> {plano.identificacao.nivel}</p>
                {serie && <p><strong>Série/Ano:</strong> {serie}</p>}
                <p><strong>Duração:</strong> {plano.identificacao.duracao}</p>
                <p><strong>Tema:</strong> {plano.identificacao.tema}</p>
                {professor && <p><strong>Professor(a):</strong> {professor}</p>}
                {turma && <p><strong>Turma:</strong> {turma}</p>}
              </div>
            </PrintSection>
          )}

          {plano.habilidades_bncc?.length > 0 && (
            <PrintSection title="Habilidades BNCC">
              {plano.habilidades_bncc.map((h: any, i: number) => (
                <p key={i} style={{ fontSize: "10pt", marginBottom: "2mm", ...justifyStyle }}><strong style={{ color: "#2563eb" }}>{h.codigo}</strong> — {h.descricao}</p>
              ))}
            </PrintSection>
          )}

          {plano.pergunta_norteadora && (
            <PrintSection title="Pergunta Norteadora (PBL)">
              <p style={{ background: "#f0f9ff", padding: "3mm", borderLeft: "3px solid #2563eb", borderRadius: "4px", fontStyle: "italic", ...justifyStyle }}>{plano.pergunta_norteadora}</p>
            </PrintSection>
          )}

          {plano.objetivos?.length > 0 && (
            <PrintSection title="Objetivos de Aprendizagem">
              <ul style={{ paddingLeft: "5mm" }}>{plano.objetivos.map((o: string, i: number) => <li key={i} style={justifyStyle}>{o}</li>)}</ul>
            </PrintSection>
          )}

          {plano.conteudo_programatico && <PrintSection title="Conteúdo Programático"><p style={{ whiteSpace: "pre-line", ...justifyStyle }}>{plano.conteudo_programatico}</p></PrintSection>}
          {plano.gancho_inicial && <PrintSection title="Gancho Inicial"><p style={justifyStyle}>{plano.gancho_inicial}</p></PrintSection>}
          {plano.problema_desafio && <PrintSection title="O Problema / Desafio"><p style={{ whiteSpace: "pre-line", ...justifyStyle }}>{plano.problema_desafio}</p></PrintSection>}
          {plano.pesquisa_exploracao && <PrintSection title="Pesquisa e Exploração"><p style={{ whiteSpace: "pre-line", ...justifyStyle }}>{plano.pesquisa_exploracao}</p></PrintSection>}
          {plano.criacao_prototipagem && <PrintSection title="Criação e Prototipagem"><p style={{ whiteSpace: "pre-line", ...justifyStyle }}>{plano.criacao_prototipagem}</p></PrintSection>}

          {plano.roteiro_sala_invertida && (
            <PrintSection title="Roteiro de Sala Invertida">
              <p style={justifyStyle}><strong>📥 Atividade Prévia:</strong> {plano.roteiro_sala_invertida.atividade_previa}</p>
              <p style={justifyStyle}><strong>🏫 Atividade em Sala:</strong> {plano.roteiro_sala_invertida.atividade_em_sala}</p>
            </PrintSection>
          )}

          {plano.gamificacao && <PrintSection title="Gamificação"><p style={{ whiteSpace: "pre-line", ...justifyStyle }}>{plano.gamificacao}</p></PrintSection>}

          {plano.cronograma_aulas?.length > 0 && (
            <PrintSection title={`Cronograma — ${plano.cronograma_aulas.length} Aulas`}>
              {plano.cronograma_aulas.map((a: any, i: number) => (
                <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: "4px", padding: "3mm", marginBottom: "3mm", pageBreakInside: "avoid" }}>
                  <p><strong>Aula {a.aula || i + 1}: {a.titulo}</strong> {a.duracao && <span style={{ color: "#64748b", fontSize: "9pt" }}>({a.duracao})</span>}</p>
                  {a.atividades && <p style={{ fontSize: "10pt", ...justifyStyle }}>{a.atividades}</p>}
                </div>
              ))}
            </PrintSection>
          )}

          {plano.cronograma && !plano.cronograma_aulas && (
            <PrintSection title="Cronograma">
              {plano.cronograma.introducao && <p style={justifyStyle}><strong>Introdução:</strong> {plano.cronograma.introducao}</p>}
              {plano.cronograma.desenvolvimento && <p style={justifyStyle}><strong>Desenvolvimento:</strong> {plano.cronograma.desenvolvimento}</p>}
              {plano.cronograma.fechamento && <p style={justifyStyle}><strong>Fechamento:</strong> {plano.cronograma.fechamento}</p>}
            </PrintSection>
          )}

          {plano.resumo_atividade && <PrintSection title="Resumo da Atividade"><p style={{ whiteSpace: "pre-line", ...justifyStyle }}>{plano.resumo_atividade}</p></PrintSection>}
          {plano.desenvolvimento && <PrintSection title="Desenvolvimento"><p style={{ whiteSpace: "pre-line", ...justifyStyle }}>{plano.desenvolvimento}</p></PrintSection>}
          {plano.recursos?.length > 0 && <PrintSection title="Recursos Necessários"><ul style={{ paddingLeft: "5mm" }}>{plano.recursos.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul></PrintSection>}
          {plano.diferenciacao && <PrintSection title="Diferenciação e Inclusão"><p style={{ whiteSpace: "pre-line", ...justifyStyle }}>{plano.diferenciacao}</p></PrintSection>}
          {plano.avaliacao && <PrintSection title="Avaliação"><p style={{ whiteSpace: "pre-line", ...justifyStyle }}>{plano.avaliacao}</p></PrintSection>}
          {plano.referencias?.length > 0 && (
            <PrintSection title="Referências (ABNT)">
              {plano.referencias.map((r: string, i: number) => <p key={i} style={{ paddingLeft: "4mm", borderLeft: "2px solid #e2e8f0", marginBottom: "2mm", fontSize: "10pt" }}>{r}</p>)}
            </PrintSection>
          )}
        </div>
      </Card>
    </div>
  );
}

function PrintSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "6mm", pageBreakInside: "avoid" }}>
      <h2 style={{ fontSize: "12pt", fontWeight: 700, color: "#2563eb", marginBottom: "2mm", fontFamily: "'Montserrat', sans-serif", pageBreakAfter: "avoid" }}>{title}</h2>
      <div style={{ fontSize: "10.5pt" }}>{children}</div>
    </div>
  );
}
