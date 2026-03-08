import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TimbreData {
  escola: string;
  logoUrl: string;
}

export function useTimbre() {
  const { user } = useAuth();
  const [timbre, setTimbre] = useState<TimbreData>({ escola: "", logoUrl: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("escola, logo_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setTimbre({
          escola: data.escola || "",
          logoUrl: (data as any).logo_url || "",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const saveTimbre = async (newTimbre: TimbreData) => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ escola: newTimbre.escola || null, logo_url: newTimbre.logoUrl || null } as any)
      .eq("user_id", user.id);
    setTimbre(newTimbre);
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (error) { console.error(error); return null; }
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    return data.publicUrl;
  };

  return { timbre, loading, saveTimbre, uploadLogo };
}
