/**
 * Fisher-Yates shuffle algorithm - returns a new shuffled array
 */
export function fisherYatesShuffle<T>(arr: T[]): { shuffled: T[]; indexMap: number[] } {
  const shuffled = [...arr];
  const indexMap = arr.map((_, i) => i);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    [indexMap[i], indexMap[j]] = [indexMap[j], indexMap[i]];
  }

  return { shuffled, indexMap };
}

export interface MapaQuestaoItem {
  questao_id: string;
  ordem_original: number;
  nova_ordem: number;
  mapa_alternativas: number[] | null; // null for open questions
  resposta_correta_original: number | null;
  resposta_correta_nova: number | null; // mapped correct index after shuffle
}

/**
 * Generate a shuffled version map for an exam's questions
 */
export function generateVersionMap(
  questoes: { id: string; tipo: string; alternativas: string[] | null; resposta_correta: number | null }[]
): MapaQuestaoItem[] {
  // Only shuffle MC questions order, keep open questions at the end
  const mcQuestions = questoes.filter(q => q.tipo === 'mc');
  const openQuestions = questoes.filter(q => q.tipo === 'open');

  const { shuffled: shuffledMc, indexMap: mcIndexMap } = fisherYatesShuffle(mcQuestions);

  const mapa: MapaQuestaoItem[] = [];

  // MC questions with shuffled order and shuffled alternatives
  shuffledMc.forEach((q, newIdx) => {
    const origIdx = mcIndexMap[newIdx];
    let mapaAlts: number[] | null = null;
    let novaCorreta: number | null = null;

    if (q.alternativas && q.alternativas.length > 0) {
      const { indexMap: altMap } = fisherYatesShuffle(q.alternativas);
      mapaAlts = altMap;
      // Find where the original correct answer ended up
      if (q.resposta_correta !== null && q.resposta_correta >= 0) {
        novaCorreta = altMap.indexOf(q.resposta_correta);
      }
    }

    mapa.push({
      questao_id: q.id,
      ordem_original: origIdx,
      nova_ordem: newIdx,
      mapa_alternativas: mapaAlts,
      resposta_correta_original: q.resposta_correta,
      resposta_correta_nova: novaCorreta,
    });
  });

  // Open questions keep their relative order after MC
  openQuestions.forEach((q, idx) => {
    mapa.push({
      questao_id: q.id,
      ordem_original: questoes.indexOf(q),
      nova_ordem: mcQuestions.length + idx,
      mapa_alternativas: null,
      resposta_correta_original: null,
      resposta_correta_nova: null,
    });
  });

  return mapa;
}

/**
 * Get the next version label (A, B, C, ..., Z, AA, AB, ...)
 */
export function getNextVersionLabel(existingLabels: string[]): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (existingLabels.length === 0) return 'A';
  
  const last = existingLabels.sort().pop()!;
  if (last.length === 1) {
    const idx = letters.indexOf(last);
    if (idx < 25) return letters[idx + 1];
    return 'AA';
  }
  return String.fromCharCode(last.charCodeAt(last.length - 1) + 1);
}
