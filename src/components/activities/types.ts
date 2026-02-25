export type BlockType = "title" | "text" | "question-open" | "question-mc" | "image";
export type Alignment = "left" | "center" | "right";

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
  imageFloat?: "none" | "left" | "right";
}
