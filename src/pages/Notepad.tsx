import { useState, useEffect, useRef } from "react";
import { StickyNote, Save, Download, Loader2, Trash2, Plus, Bold, Italic, Underline, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

export default function Notepad() {
  const { user } = useAuth();
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

  const handleDownload = () => {
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

  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <StickyNote className="h-6 w-6 text-primary" /> Bloco de Notas
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Faça anotações, formate e baixe quando precisar</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Notes list */}
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

        {/* Editor */}
        {current ? (
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <Input
                value={current.titulo}
                onChange={(e) => setCurrent({ ...current, titulo: e.target.value })}
                className="font-display text-lg font-bold border-0 p-0 h-auto focus-visible:ring-0"
                placeholder="Título da nota"
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-muted/30 p-2">
                <Select value={font} onValueChange={(v) => { setFont(v); execCmd("fontName", v); }}>
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map((f) => (
                      <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={fontSize} onValueChange={(v) => { setFontSize(v); execCmd("fontSize", "7"); setTimeout(() => { const els = editorRef.current?.querySelectorAll('font[size="7"]'); els?.forEach((el) => { (el as HTMLElement).removeAttribute("size"); (el as HTMLElement).style.fontSize = v; }); }, 0); }}>
                  <SelectTrigger className="h-8 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-0.5 border-l pl-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      className={`h-6 w-6 rounded border ${fontColor === c ? "ring-2 ring-primary" : ""}`}
                      style={{ backgroundColor: c }}
                      onClick={() => { setFontColor(c); execCmd("foreColor", c); }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-0.5 border-l pl-1.5">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => execCmd("bold")}><Bold className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => execCmd("italic")}><Italic className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => execCmd("underline")}><Underline className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Editable area */}
              <div
                ref={editorRef}
                contentEditable
                className="min-h-[300px] rounded-lg border bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                style={{ fontFamily: font, fontSize, color: fontColor }}
                suppressContentEditableWarning
              />

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-primary-foreground hover:opacity-90">
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="mr-2 h-4 w-4" /> Salvar</>}
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" /> Baixar HTML
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card flex items-center justify-center min-h-[300px]">
            <p className="text-muted-foreground text-sm">Selecione ou crie uma nota para começar</p>
          </Card>
        )}
      </div>
    </div>
  );
}
