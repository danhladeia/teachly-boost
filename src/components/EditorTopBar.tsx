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
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {leading}
          <h1 className="font-semibold text-lg">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {onPrint && (
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          )}
          {onPdf && (
            <Button variant="outline" size="sm" onClick={onPdf}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}
          {onDocx && (
            <Button variant="outline" size="sm" onClick={onDocx}>
              <Download className="h-4 w-4 mr-2" />
              DOCX
            </Button>
          )}
          {onPptx && (
            <Button variant="outline" size="sm" onClick={onPptx}>
              <Download className="h-4 w-4 mr-2" />
              PPTX
            </Button>
          )}
          {actions.map((action, index) => (
            <React.Fragment key={index}>{action}</React.Fragment>
          ))}
          {onSave && (
            <Button onClick={onSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}