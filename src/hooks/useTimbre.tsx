import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TimbreData {
  id?: string;
  escola: string;
  logoUrl: string;
  bannerUrl?: string;
  showNomeEscola: boolean;
  showProfessor: boolean;
  showDisciplina: boolean;
  showSerie: boolean;
  showAluno: boolean;
  showData: boolean;
}

export const defaultTimbre: TimbreData = {
  escola: "",
  logoUrl: "",
  bannerUrl: "",
  showNomeEscola: true,
  showProfessor: true,
  showDisciplina: true,
  showSerie: true,
  showAluno: true,
  showData: true,
};

export function useTimbre() {
  const { user } = useAuth();
  const [timbres, setTimbres] = useState<TimbreData[]>([]);
  const [timbre, setTimbre] = useState<TimbreData>(defaultTimbre);
  const [loading, setLoading] = useState(true);

  const loadTimbres = async () => {
    if (!user) { setLoading(false); return; }
    // Load from new timbres table
    const { data: timbresData } = await supabase
      .from("timbres" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (timbresData && (timbresData as any[]).length > 0) {
      const mapped = (timbresData as any[]).map((t: any) => ({
        id: t.id,
        escola: t.nome_escola || "",
        logoUrl: t.logo_url || "",
        showNomeEscola: t.show_nome_escola ?? true,
        showProfessor: t.show_professor ?? true,
        showDisciplina: t.show_disciplina ?? true,
        showSerie: t.show_serie ?? true,
        showAluno: t.show_aluno ?? true,
        showData: t.show_data ?? true,
      }));
      setTimbres(mapped);
      setTimbre(mapped[0]);
    } else {
      // Fallback: migrate from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("escola, logo_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.escola || (profile as any)?.logo_url) {
        const legacy: TimbreData = {
          escola: profile.escola || "",
          logoUrl: (profile as any).logo_url || "",
          ...defaultTimbre,
        };
        legacy.escola = profile.escola || "";
        legacy.logoUrl = (profile as any).logo_url || "";
        setTimbre(legacy);
        setTimbres([legacy]);
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadTimbres(); }, [user]);

  const saveTimbre = async (data: TimbreData): Promise<TimbreData | null> => {
    if (!user) return null;
    const row = {
      user_id: user.id,
      nome_escola: data.escola,
      logo_url: data.logoUrl || null,
      show_nome_escola: data.showNomeEscola,
      show_professor: data.showProfessor,
      show_disciplina: data.showDisciplina,
      show_serie: data.showSerie,
      show_aluno: data.showAluno,
      show_data: data.showData,
    };

    if (data.id) {
      await (supabase.from("timbres" as any) as any).update(row).eq("id", data.id);
      await loadTimbres();
      return data;
    } else {
      const { data: inserted } = await (supabase.from("timbres" as any) as any).insert(row).select().single();
      await loadTimbres();
      return inserted ? { ...data, id: (inserted as any).id } : null;
    }
  };

  const deleteTimbre = async (id: string) => {
    if (!user) return;
    await (supabase.from("timbres" as any) as any).delete().eq("id", id);
    await loadTimbres();
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (error) { console.error(error); return null; }
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    return data.publicUrl;
  };

  const selectTimbre = (id: string) => {
    const found = timbres.find(t => t.id === id);
    if (found) setTimbre(found);
  };

  return { timbre, timbres, loading, saveTimbre, deleteTimbre, uploadLogo, selectTimbre, loadTimbres };
}
