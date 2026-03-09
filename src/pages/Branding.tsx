import { useState, useEffect } from "react";
import { Stamp, Upload, Save, Loader2, Trash2, AlertTriangle, Plus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTimbre, defaultTimbre, type TimbreData } from "@/hooks/useTimbre";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { Link } from "react-router-dom";

export default function Branding() {
  const { user } = useAuth();
  const { timbres, loading, saveTimbre, deleteTimbre, uploadLogo } = useTimbre();
  const { plan } = useCredits();

  const [editing, setEditing] = useState<TimbreData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const maxTimbres = plan.planType === "ultra" ? Infinity : plan.logosLimit;
  const canAddNew = plan.planType === "ultra" || timbres.length < maxTimbres;

  const startNew = () => setEditing({ ...defaultTimbre });
  const startEdit = (t: TimbreData) => setEditing({ ...t });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Máximo 2MB"); return; }
    setUploading(true);
    const url = await uploadLogo(file);
    if (url) setEditing({ ...editing, logoUrl: url });
    else toast.error("Erro ao enviar logo");
    setUploading(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB"); return; }
    setUploading(true);
    const url = await uploadLogo(file);
    if (url) setEditing({ ...editing, bannerUrl: url });
    else toast.error("Erro ao enviar banner");
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user || !editing) return;
    setSaving(true);
    const result = await saveTimbre(editing);
    if (result) {
      toast.success("Timbre salvo!");
      setEditing(null);
    } else {
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTimbre(id);
    toast.success("Timbre removido");
    if (editing?.id === id) setEditing(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Stamp className="h-6 w-6 text-primary" /> Timbres e Branding
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure a identidade visual dos seus materiais. O timbre será aplicado em jogos, atividades e provas.
        </p>
      </div>

      {plan.logosLimit === 0 && plan.planType === "starter" && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-50 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">Plano Starter não inclui timbres</p>
            <p className="text-yellow-700">
              <Link to="/app/planos" className="font-medium text-primary hover:underline">Faça upgrade para Pro</Link> para cadastrar o timbre da sua escola.
            </p>
          </div>
        </div>
      )}

      {/* List of timbres */}
      <div className="grid gap-3 sm:grid-cols-2">
        {timbres.map((t) => (
          <Card key={t.id} className="shadow-card cursor-pointer hover:shadow-elevated transition-shadow" onClick={() => startEdit(t)}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                {t.logoUrl ? (
                  <img src={t.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded border p-0.5" crossOrigin="anonymous" />
                ) : (
                  <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center text-muted-foreground">
                    <Stamp className="h-5 w-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{t.escola || "Sem nome"}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {t.showProfessor && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Professor</span>}
                    {t.showDisciplina && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Disciplina</span>}
                    {t.showSerie && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Série</span>}
                    {t.showAluno && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Aluno</span>}
                    {t.showData && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Data</span>}
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); handleDelete(t.id!); }}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {canAddNew && (
          <Card className="shadow-card border-dashed cursor-pointer hover:bg-muted/50 transition-colors" onClick={startNew}>
            <CardContent className="pt-4 pb-4 flex items-center justify-center gap-2 text-muted-foreground">
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">Novo timbre</span>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Editor */}
      {editing && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">{editing.id ? "Editar Timbre" : "Novo Timbre"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Escola</Label>
              <Input placeholder="Ex: E.M. Paulo Freire" value={editing.escola} onChange={e => setEditing({ ...editing, escola: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Logo da escola</Label>
              {editing.logoUrl ? (
                <div className="flex items-center gap-4">
                  <img src={editing.logoUrl} alt="Logo" className="h-16 object-contain rounded border p-1" crossOrigin="anonymous" />
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="logo-replace" className="cursor-pointer text-xs text-primary hover:underline">Trocar logo</Label>
                    <input id="logo-replace" type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoUpload} />
                    <button onClick={() => setEditing({ ...editing, logoUrl: "" })} className="text-xs text-destructive hover:underline flex items-center gap-1">
                      <Trash2 className="h-3 w-3" /> Remover
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <div className="text-center">
                    {uploading ? <Loader2 className="h-6 w-6 text-muted-foreground mx-auto mb-1 animate-spin" /> : <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />}
                    <p className="text-xs text-muted-foreground">{uploading ? "Enviando..." : "PNG, JPG - max 2MB"}</p>
                  </div>
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoUpload} />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label>Banner completo (opcional)</Label>
              <p className="text-xs text-muted-foreground">Cabeçalho personalizado que substitui logo + nome da escola</p>
              {editing.bannerUrl ? (
                <div className="space-y-2">
                  <img src={editing.bannerUrl} alt="Banner" className="w-full h-20 object-cover rounded border" crossOrigin="anonymous" />
                  <div className="flex gap-2">
                    <Label htmlFor="banner-replace" className="cursor-pointer text-xs text-primary hover:underline">Trocar banner</Label>
                    <input id="banner-replace" type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleBannerUpload} />
                    <button onClick={() => setEditing({ ...editing, bannerUrl: "" })} className="text-xs text-destructive hover:underline flex items-center gap-1">
                      <Trash2 className="h-3 w-3" /> Remover
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <div className="text-center">
                    {uploading ? <Loader2 className="h-6 w-6 text-muted-foreground mx-auto mb-1 animate-spin" /> : <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />}
                    <p className="text-xs text-muted-foreground">{uploading ? "Enviando..." : "PNG, JPG - max 5MB"}</p>
                  </div>
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleBannerUpload} />
                </label>
              )}
            </div>

            {/* Optional fields toggles */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Campos do cabeçalho</Label>
              <p className="text-xs text-muted-foreground">Escolha quais campos aparecem no timbre</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {[
                  { key: "showNomeEscola" as const, label: "Nome da Escola" },
                  { key: "showProfessor" as const, label: "Professor(a)" },
                  { key: "showDisciplina" as const, label: "Disciplina" },
                  { key: "showSerie" as const, label: "Série" },
                  { key: "showAluno" as const, label: "Aluno(a)" },
                  { key: "showData" as const, label: "Data" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Switch
                      checked={editing[key]}
                      onCheckedChange={(v) => setEditing({ ...editing, [key]: v })}
                      id={`toggle-${key}`}
                    />
                    <Label htmlFor={`toggle-${key}`} className="text-xs">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview do cabeçalho</Label>
              <div className="rounded-lg border bg-white p-4">
                <div className="flex items-center justify-center gap-4 border-b-2 border-black pb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {editing.logoUrl && <img src={editing.logoUrl} alt="Logo" className="h-10 object-contain" crossOrigin="anonymous" />}
                  {editing.showNomeEscola && editing.escola && <span className="font-bold text-lg text-black">{editing.escola}</span>}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2 flex-wrap gap-1">
                  {editing.showProfessor && <span>Professor(a): ________________</span>}
                  {editing.showDisciplina && <span>Disciplina: ________________</span>}
                  {editing.showSerie && <span>Série: ________</span>}
                </div>
                {(editing.showAluno || editing.showData) && (
                  <div className="flex justify-between text-xs text-gray-500 mt-1 flex-wrap gap-1">
                    {editing.showAluno && <span>Aluno(a): ________________________________</span>}
                    {editing.showData && <span>Data: ____/____/________</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-primary-foreground hover:opacity-90">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="mr-2 h-4 w-4" /> Salvar Timbre</>}
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
