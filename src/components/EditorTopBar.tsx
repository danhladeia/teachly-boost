import React from "react";
import { Button } from "@/components/ui/button";
import { Printer, Save, Download, FileText } from "lucide-react";

interface EditorTopBarProps {
  title: string;
  onSave?: () => void;
  onPrint?: () => void;
  onPdf?: () => void;
  onDocx?: () => void;
  onPptx?: () => void;
  saving?: boolean;
  actions?: React.ReactNode[];
  leading?: React.ReactNode;
  children?: React.ReactNode;
}

export default function EditorTopBar({
  title,
  onSave,
  onPrint,
  onPdf,
  onDocx,
  onPptx,
  saving = false,
  actions = [],
  leading,
  children
}: EditorTopBarProps) {
  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-3 sm:px-6 py-2 sm:py-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {leading}
          <h1 className="font-semibold text-sm sm:text-lg truncate">{title}</h1>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {onPrint && (
            <Button variant="outline" size="sm" onClick={onPrint} className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3">
              <Printer className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Imprimir
            </Button>
          )}
          {onPdf && (
            <Button variant="outline" size="sm" onClick={onPdf} className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              PDF
            </Button>
          )}
          {onDocx && (
            <Button variant="outline" size="sm" onClick={onDocx} className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              DOCX
            </Button>
          )}
          {onPptx && (
            <Button variant="outline" size="sm" onClick={onPptx} className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              PPTX
            </Button>
          )}
          {actions.map((action, index) => (
            <React.Fragment key={index}>{action}</React.Fragment>
          ))}
          {onSave && (
            <Button onClick={onSave} disabled={saving} size="sm" className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3">
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
