export type BlockType = "title" | "text" | "question-open" | "question-mc" | "question-enem" | "image" | "separator" | "page-break";
export type Alignment = "left" | "center" | "right";
export type ImageFloat = "none" | "left" | "right" | "alternating";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  alignment: Alignment;
  alternatives?: string[];
  correctIndex?: number;
  lines?: number;
  imageUrl?: string;
  imageSize?: "small" | "medium" | "large";
  imageFloat?: ImageFloat;
  // ENEM-specific fields
  textoBase?: string;
  fonte?: string;
  questionImageUrl?: string;
}
