import { useState, useEffect } from "react";
import { Stamp, Upload, Save, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTimbre } from "@/hooks/useTimbre";
import { useAuth } from "@/hooks/useAuth";

export default function Branding() {
  const { user } = useAuth();
  const { timbre, loading, saveTimbre, uploadLogo } = useTimbre();
  const [escola, setEscola] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setEscola(timbre.escola);
    setLogoUrl(timbre.logoUrl);
  }, [timbre]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Máximo 2MB"); return; }
    setUploading(true);
    const url = await uploadLogo(file);
    if (url) {
      setLogoUrl(url);
      toast.success("Logo enviado!");
    } else {
      toast.error("Erro ao enviar logo");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) { toast.error("Faça login primeiro"); return; }
    setSaving(true);
    await saveTimbre({ escola, logoUrl });
    toast.success("Timbre salvo! Será aplicado em todos os materiais.");
    setSaving(false);
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
          Configure a identidade visual dos seus materiais. O timbre será aplicado automaticamente em jogos, atividades e provas.
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Timbre da Escola</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Escola</Label>
            <Input
              placeholder="Ex: E.M. Paulo Freire"
              value={escola}
              onChange={e => setEscola(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Logo da escola</Label>
            {logoUrl ? (
              <div className="flex items-center gap-4">
                <img src={logoUrl} alt="Logo" className="h-16 object-contain rounded border p-1" crossOrigin="anonymous" />
                <div className="flex flex-col gap-1">
                  <Label htmlFor="logo-replace" className="cursor-pointer text-xs text-primary hover:underline">
                    Trocar logo
                  </Label>
                  <input id="logo-replace" type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoUpload} />
                  <button
                    onClick={() => setLogoUrl("")}
                    className="text-xs text-destructive hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> Remover
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                <div className="text-center">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {uploading ? "Enviando..." : "Clique para enviar (PNG, JPG - max 2MB)"}
                  </p>
                </div>
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoUpload} />
              </label>
            )}
          </div>

          {/* Preview */}
          {(escola || logoUrl) && (
            <div className="space-y-2">
              <Label>Preview do cabeçalho</Label>
              <div className="rounded-lg border bg-white p-4">
                <div className="flex items-center justify-center gap-4 border-b-2 border-black pb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo" className="h-10 object-contain" crossOrigin="anonymous" />
                  )}
                  {escola && (
                    <span className="font-bold text-lg text-black">{escola}</span>
                  )}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Professor(a): ________________</span>
                  <span>Disciplina: ________________</span>
                  <span>Série: ________</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Aluno(a): ________________________________</span>
                  <span>Data: ____/____/________</span>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="gradient-primary border-0 text-primary-foreground hover:opacity-90"
          >
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Salvar Timbre</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
