import { useState, useEffect, useRef } from "react";
import { StickyNote, Save, Download, Loader2, Trash2, Plus, Bold, Italic, Underline, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

interface Note {
  id?: string;
  titulo: string;
  conteudo: string;
}

const FONTS = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Verdana', sans-serif", label: "Verdana" },
];

const SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];

const COLORS = [
  "#000000", "#333333", "#666666", "#1d4ed8", "#dc2626",
  "#16a34a", "#9333ea", "#ea580c", "#0891b2",
];

function htmlToDocxParagraphs(html: string): Paragraph[] {
  const div = document.createElement("div");
  div.innerHTML = html;
  const paragraphs: Paragraph[] = [];

  const processNode = (node: Node): TextRun[] => {
    const runs: TextRun[] = [];
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (text) {
        const parent = node.parentElement;
        const isBold = parent?.closest("b,strong") !== null;
        const isItalic = parent?.closest("i,em") !== null;
        const isUnderline = parent?.closest("u") !== null;
        runs.push(new TextRun({ text, bold: isBold, italics: isItalic, underline: isUnderline ? {} : undefined }));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      node.childNodes.forEach((child) => {
        runs.push(...processNode(child));
      });
    }
    return runs;
  };

  const blocks = div.querySelectorAll("p, div, br");
  if (blocks.length === 0) {
    // No block elements, treat whole content as one paragraph
    const runs = processNode(div);
    if (runs.length > 0) paragraphs.push(new Paragraph({ children: runs }));
  } else {
    div.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (tag === "br") {
          paragraphs.push(new Paragraph({ children: [] }));
        } else {
          const runs = processNode(el);
          paragraphs.push(new Paragraph({ children: runs }));
        }
      } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
        paragraphs.push(new Paragraph({ children: [new TextRun(child.textContent)] }));
      }
    });
  }

  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({ children: [new TextRun("")] }));
  }

  return paragraphs;
}

export default function Notepad() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [notes, setNotes] = useState<Note[]>([]);
  const [current, setCurrent] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const [font, setFont] = useState(FONTS[0].value);
  const [fontSize, setFontSize] = useState("16px");
  const [fontColor, setFontColor] = useState("#000000");

  useEffect(() => { loadNotes(); }, [user]);

  const loadNotes = async () => {
    if (!user) return;
    const { data } = await (supabase.from("notas_professor" as any) as any)
      .select("id, titulo, conteudo, created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (data) setNotes(data.map((n: any) => ({ id: n.id, titulo: n.titulo, conteudo: n.conteudo })));
    setLoading(false);
  };

  const openNote = (note: Note) => {
    setCurrent(note);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = note.conteudo;
    }, 50);
  };

  const startNew = () => {
    const n: Note = { titulo: "Nova nota", conteudo: "" };
    setCurrent(n);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = "";
    }, 50);
  };

  const handleSave = async () => {
    if (!user || !current) return;
    setSaving(true);
    const html = editorRef.current?.innerHTML || "";
    const row = { user_id: user.id, titulo: current.titulo, conteudo: html };

    if (current.id) {
      await (supabase.from("notas_professor" as any) as any).update({ titulo: current.titulo, conteudo: html }).eq("id", current.id);
    } else {
      const { data } = await (supabase.from("notas_professor" as any) as any).insert(row).select().single();
      if (data) setCurrent({ ...current, id: (data as any).id });
    }
    await loadNotes();
    toast.success("Nota salva!");
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await (supabase.from("notas_professor" as any) as any).delete().eq("id", id);
    if (current?.id === id) setCurrent(null);
    await loadNotes();
    toast.success("Nota excluída");
  };

  const handleDownloadHTML = () => {
    if (!editorRef.current || !current) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${current.titulo}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;}</style>
</head><body>${editorRef.current.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${current.titulo}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDOCX = async () => {
    if (!editorRef.current || !current) return;
    try {
      const contentParagraphs = htmlToDocxParagraphs(editorRef.current.innerHTML);
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: current.titulo, bold: true, size: 32 })],
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            }),
            ...contentParagraphs,
          ],
        }],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${current.titulo}.docx`);
      toast.success("DOCX exportado!");
    } catch {
      toast.error("Erro ao exportar DOCX");
    }
  };

  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  // Mobile: show list OR editor, not both
  const showList = isMobile ? !current : true;
  const showEditor = isMobile ? !!current : true;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
          <StickyNote className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Bloco de Notas
        </h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Faça anotações, formate e baixe quando precisar</p>
      </div>

      <div className={`grid gap-4 ${!isMobile ? "lg:grid-cols-[280px_1fr]" : ""}`}>
        {/* Notes list */}
        {showList && (
          <div className="space-y-2">
            <Button onClick={startNew} className="w-full" variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nova nota
            </Button>
            {notes.map((n) => (
              <Card
                key={n.id}
                className={`cursor-pointer hover:bg-muted/50 transition-colors ${current?.id === n.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => openNote(n)}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <p className="text-sm font-medium truncate flex-1">{n.titulo}</p>
                  <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); handleDelete(n.id!); }}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {notes.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma nota ainda</p>}
          </div>
        )}

        {/* Editor */}
        {showEditor && current ? (
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              {isMobile && (
                <Button variant="ghost" size="sm" className="w-fit mb-2 text-xs" onClick={() => setCurrent(null)}>
                  ← Voltar às notas
                </Button>
              )}
              <Input
                value={current.titulo}
                onChange={(e) => setCurrent({ ...current, titulo: e.target.value })}
                className="font-display text-base sm:text-lg font-bold border-0 p-0 h-auto focus-visible:ring-0"
                placeholder="Título da nota"
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 rounded-lg border bg-muted/30 p-1.5 sm:p-2">
                <Select value={font} onValueChange={(v) => { setFont(v); execCmd("fontName", v); }}>
                  <SelectTrigger className="h-7 sm:h-8 w-[110px] sm:w-[140px] text-[10px] sm:text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map((f) => (
                      <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={fontSize} onValueChange={(v) => { setFontSize(v); execCmd("fontSize", "7"); setTimeout(() => { const els = editorRef.current?.querySelectorAll('font[size="7"]'); els?.forEach((el) => { (el as HTMLElement).removeAttribute("size"); (el as HTMLElement).style.fontSize = v; }); }, 0); }}>
                  <SelectTrigger className="h-7 sm:h-8 w-[60px] sm:w-[70px] text-[10px] sm:text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-0.5 border-l pl-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      className={`h-5 w-5 sm:h-6 sm:w-6 rounded border ${fontColor === c ? "ring-2 ring-primary" : ""}`}
                      style={{ backgroundColor: c }}
                      onClick={() => { setFontColor(c); execCmd("foreColor", c); }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-0.5 border-l pl-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => execCmd("bold")}><Bold className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => execCmd("italic")}><Italic className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => execCmd("underline")}><Underline className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
                </div>
              </div>

              {/* Editable area */}
              <div
                ref={editorRef}
                contentEditable
                className="min-h-[200px] sm:min-h-[300px] rounded-lg border bg-background p-3 sm:p-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                style={{ fontFamily: font, fontSize, color: fontColor }}
                suppressContentEditableWarning
              />

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={saving} size={isMobile ? "sm" : "default"} className="gradient-primary border-0 text-primary-foreground hover:opacity-90">
                  {saving ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="mr-1.5 h-4 w-4" /> Salvar</>}
                </Button>
                <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={handleDownloadHTML}>
                  <Download className="mr-1.5 h-4 w-4" /> HTML
                </Button>
                <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={handleDownloadDOCX}>
                  <FileText className="mr-1.5 h-4 w-4" /> DOCX
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !isMobile ? (
          <Card className="shadow-card flex items-center justify-center min-h-[300px]">
            <p className="text-muted-foreground text-sm">Selecione ou crie uma nota para começar</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
