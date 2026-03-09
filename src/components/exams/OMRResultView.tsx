import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface DetectedAnswer {
  questao: number;
  alternativa: number | null;
  confianca: "high" | "low" | "none";
}

interface CorrectionDetail {
  q: number;
  selected: number;
  correct: number;
  isCorrect: boolean;
  pontos: number;
}

interface OMRResultViewProps {
  gabarito?: { q: number; correct: number }[];
  respostas: DetectedAnswer[];
  manualOverrides: Record<number, number>;
  correctionDetails?: CorrectionDetail[];
  onOverrideUpdate?: (questao: number, alt: number) => void;
  showCorrection?: boolean;
}

const altLabels = ["A", "B", "C", "D"];

export default function OMRResultView({ 
  gabarito = [], 
  respostas, 
  manualOverrides, 
  correctionDetails,
  onOverrideUpdate,
  showCorrection = false
}: OMRResultViewProps) {
  // Determine total questions from gabarito or respostas
  const totalQuestions = Math.max(
    gabarito.length,
    respostas.length > 0 ? Math.max(...respostas.map(r => r.questao)) : 0
  );
  
  if (totalQuestions === 0) return null;

  // Group questions into columns (like physical OMR sheets)
  const questionsPerColumn = 10;
  const totalColumns = Math.ceil(totalQuestions / questionsPerColumn);

  const getQuestionData = (qNum: number) => {
    const detected = respostas.find(r => r.questao === qNum);
    const gabItem = gabarito.find(g => g.q === qNum);
    const corrDetail = correctionDetails?.find(d => d.q === qNum);
    const finalAlt = manualOverrides[qNum] ?? detected?.alternativa;
    const isManual = qNum in manualOverrides;
    const isLow = detected?.confianca === "low";

    return { detected, gabItem, corrDetail, finalAlt, isManual, isLow };
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-sm font-semibold mb-2">Gabarito e Respostas</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Resposta detectada</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span>Baixa confiança</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Correção manual</span>
            </div>
            {showCorrection && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Gabarito correto</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OMR Columns Layout */}
      <div className="flex flex-wrap justify-center gap-6 md:gap-8">
        {Array.from({ length: totalColumns }, (_, colIdx) => {
          const startQ = colIdx * questionsPerColumn + 1;
          const endQ = Math.min(startQ + questionsPerColumn - 1, totalQuestions);

          return (
            <div key={colIdx} className="flex flex-col space-y-2">
              {/* Column Header */}
              <div className="text-center text-xs font-medium text-muted-foreground mb-1">
                Q{startQ}-{endQ}
              </div>
              
              {/* Questions in vertical layout */}
              {Array.from({ length: endQ - startQ + 1 }, (_, qIdx) => {
                const qNum = startQ + qIdx;
                const { gabItem, finalAlt, isManual, isLow, corrDetail } = getQuestionData(qNum);

                return (
                  <div key={qNum} className="flex items-center gap-2">
                    {/* Question number */}
                    <span className="text-xs font-mono font-semibold w-7 text-right">
                      {qNum}.
                    </span>

                    {/* Answer options */}
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map(alt => {
                        const isSelected = finalAlt === alt;
                        const isCorrect = gabItem?.correct === alt;
                        
                        let buttonClass = "w-6 h-6 rounded-full text-[9px] font-bold border transition-all ";
                        
                        if (showCorrection && isCorrect) {
                          // Show correct answer in green
                          buttonClass += isSelected 
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-green-500 text-green-500 bg-green-50";
                        } else if (isSelected) {
                          // Show selected answer
                          if (isManual) {
                            buttonClass += "bg-amber-500 border-amber-500 text-white";
                          } else if (isLow) {
                            buttonClass += "bg-amber-400 border-amber-400 text-white animate-pulse";
                          } else {
                            buttonClass += "bg-primary border-primary text-primary-foreground";
                          }
                        } else {
                          buttonClass += "border-border hover:border-muted-foreground";
                        }

                        return (
                          <button
                            key={alt}
                            onClick={() => onOverrideUpdate?.(qNum, alt)}
                            className={buttonClass}
                            disabled={!onOverrideUpdate}
                          >
                            {altLabels[alt]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Correction indicator */}
                    {showCorrection && corrDetail && (
                      <div className="w-4">
                        {corrDetail.isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Question count info */}
      <div className="text-center text-xs text-muted-foreground">
        {totalQuestions} questão{totalQuestions !== 1 ? "ões" : ""} • 
        {respostas.filter(r => r.alternativa !== null).length} resposta{respostas.filter(r => r.alternativa !== null).length !== 1 ? "s" : ""} detectada{respostas.filter(r => r.alternativa !== null).length !== 1 ? "s" : ""}
        {Object.keys(manualOverrides).length > 0 && (
          <span> • {Object.keys(manualOverrides).length} correção{Object.keys(manualOverrides).length !== 1 ? "ões" : ""} manual{Object.keys(manualOverrides).length !== 1 ? "is" : ""}</span>
        )}
      </div>
    </div>
  );
}