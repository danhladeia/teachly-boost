

## Plan: Multiple Generator Improvements

### 1. Activities: Answer Lines Toggle
- In `Activities.tsx`, the `showLines` toggle already exists (line 508-509). This controls whether open questions show answer lines. This is already implemented. No changes needed — it already allows toggling "Linhas para resposta (questões abertas)".
- The AI prompt in `generate-atividade` edge function should already correlate questions with the generated text. If the user is asking for stronger correlation, we'd need to update the edge function prompt — but that's already the intended behavior. We can reinforce the prompt instruction.

### 2. BNCC Planner Header Centering
- In `PlanoPreview.tsx`, the header rendering needs to be checked and ensured the timbre/logo/banner is centered. Will verify the render section and ensure `text-align: center` is applied to the institutional header block.

### 3. Slides Generator: Upload after Texto Base
- In `SlideConfigPanel.tsx`, move the file upload section (lines 165-173) to appear right after the "Texto base" textarea (line 83), so the flow is: Texto Base → Upload documento base.

### 4. Maze: Remove challenges, generate only maze
- In `GameFactory.tsx` maze section (lines 845-895), remove the "Incluir perguntas nos checkpoints" UI for manual mode, and in AI mode for maze, don't request questions.
- Update `GAMES` array description for "labirinto" — remove "resolvendo perguntas".
- Update `MazePreview.tsx` — it's already clean (no questions rendered). The maze generator already supports no questions. Just remove the UI controls.

### 5. Remove Color Mode from All Games
- In `GameFactory.tsx`, remove the "Aparência" section with color mode selector (lines 897-921). Keep only the answer key selector.
- Set `colorMode` default to a fixed value (e.g., always "color" or "grayscale").

### 6. Standardize Institutional Header Across All Generators
Make all generators use the same "Cabeçalho Institucional" pattern as BNCC Planner (lines 191-218 of BNCCPlanner.tsx):
- Dashed border container with `🏫 Cabeçalho Institucional` label
- `TimbreSelector` component
- Fallback manual school name input (only when no timbre selected)
- Professor + Turma fields in a grid

**Pages to update:**
- **DiagramGenerator.tsx**: Currently has bare `TimbreSelector` without the institutional container. Wrap in the BNCC-style dashed border container, add escola, professor, turma fields.
- **Exams.tsx**: Already has similar structure but uses different label ("Cabeçalho da Prova"). Standardize to match BNCC pattern with dashed border and `🏫 Cabeçalho Institucional` label.
- **Activities.tsx**: Same — standardize container style.
- **GameFactory.tsx**: Already has TimbreSelector in a Section. Refactor to use the BNCC pattern.
- **SlideConfigPanel.tsx**: Already has a card with TimbreSelector. Standardize label and layout.

### Files to Edit
1. `src/pages/Activities.tsx` — Standardize header section styling
2. `src/pages/Exams.tsx` — Standardize header section styling
3. `src/pages/DiagramGenerator.tsx` — Add full institutional header (escola, professor, turma) with BNCC pattern
4. `src/pages/GameFactory.tsx` — Remove color mode, remove maze questions UI, standardize header
5. `src/components/slides/SlideConfigPanel.tsx` — Move file upload after texto base, standardize header label
6. `src/components/bncc/PlanoPreview.tsx` — Ensure header is centered
7. `supabase/functions/generate-atividade/index.ts` — Reinforce prompt to correlate questions with text

### Implementation Order
1. Standardize all headers to BNCC pattern
2. Remove color mode from games
3. Remove maze question UI
4. Move slides file upload
5. Verify PlanoPreview header centering
6. Update edge function prompt for activity question correlation

