import { Stamp, ChevronDown } from "lucide-react";
import { useTimbre, type TimbreData } from "@/hooks/useTimbre";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface TimbreSelectorProps {
  onSelect: (timbre: TimbreData | null) => void;
  selectedId?: string;
  label?: string;
}

export default function TimbreSelector({ onSelect, selectedId, label = "Timbre da escola" }: TimbreSelectorProps) {
  const { timbres, loading } = useTimbre();

  if (loading || timbres.length === 0) return null;

  // Auto-select single timbre on first render
  if (timbres.length === 1) {
    const t = timbres[0];
    return (
      <div className="space-y-1">
        {label && <Label className="text-[10px] font-semibold flex items-center gap-1"><Stamp className="h-3 w-3" /> {label}</Label>}
        <button
          type="button"
          onClick={() => onSelect(t)}
          className={`w-full flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors hover:bg-accent/50 ${selectedId === t.id ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}
        >
          {t.logoUrl ? (
            <img src={t.logoUrl} alt="" className="h-5 w-5 object-contain rounded shrink-0" crossOrigin="anonymous" />
          ) : (
            <Stamp className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="font-medium truncate">{t.escola || "Escola sem nome"}</span>
          {selectedId === t.id && <span className="ml-auto text-[10px] text-primary font-semibold">Ativo</span>}
        </button>
      </div>
    );
  }

  // Multiple timbres — dropdown
  return (
    <div className="space-y-1">
      {label && <Label className="text-[10px] font-semibold flex items-center gap-1"><Stamp className="h-3 w-3" /> {label}</Label>}
      <Select
        value={selectedId || ""}
        onValueChange={id => {
          if (!id) { onSelect(null); return; }
          const t = timbres.find(t => t.id === id);
          onSelect(t || null);
        }}
      >
        <SelectTrigger className="h-8 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            {selectedId && timbres.find(t => t.id === selectedId)?.logoUrl ? (
              <img
                src={timbres.find(t => t.id === selectedId)!.logoUrl}
                alt=""
                className="h-4 w-4 object-contain shrink-0"
                crossOrigin="anonymous"
              />
            ) : (
              <Stamp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <SelectValue placeholder="Selecionar escola..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">
            <span className="text-muted-foreground">Sem timbre</span>
          </SelectItem>
          {timbres.map(t => (
            <SelectItem key={t.id} value={t.id!}>
              <div className="flex items-center gap-2">
                {t.logoUrl ? (
                  <img src={t.logoUrl} alt="" className="h-4 w-4 object-contain" crossOrigin="anonymous" />
                ) : (
                  <Stamp className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span>{t.escola || "Escola sem nome"}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
