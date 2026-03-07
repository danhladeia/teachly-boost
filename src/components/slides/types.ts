export interface Slide {
  title: string;
  content: string;
  notes: string;
  image_prompt: string;
  image_url?: string;
  layout: string;
}

export type SlideTemplate = "moderno" | "kids" | "cientifico" | "tech" | "minimal";
export type SlideDensity = "visual" | "informativo";

export interface TemplateColors {
  bg: string;
  text: string;
  accent: string;
  muted: string;
}

export const templateColorMap: Record<SlideTemplate, TemplateColors> = {
  moderno: { bg: "#0f172a", text: "#f1f5f9", accent: "#3b82f6", muted: "#334155" },
  kids: { bg: "#fef3c7", text: "#1e293b", accent: "#f59e0b", muted: "#fde68a" },
  cientifico: { bg: "#f8fafc", text: "#0f172a", accent: "#0ea5e9", muted: "#e2e8f0" },
  tech: { bg: "#020617", text: "#e2e8f0", accent: "#a855f7", muted: "#1e1b4b" },
  minimal: { bg: "#ffffff", text: "#18181b", accent: "#18181b", muted: "#f4f4f5" },
};

export const estilosImagem = [
  { value: "realistic", label: "Realista / Fotográfica", desc: "Fotos reais e detalhadas" },
  { value: "cartoon", label: "Cartoon / Desenho", desc: "Ilustrações coloridas e divertidas" },
  { value: "watercolor", label: "Aquarela", desc: "Estilo artístico com pinceladas suaves" },
  { value: "flat", label: "Flat / Vetorial", desc: "Ícones e formas simples e limpas" },
  { value: "3d", label: "3D Render", desc: "Objetos tridimensionais renderizados" },
  { value: "scientific", label: "Científico / Diagrama", desc: "Diagramas e ilustrações técnicas" },
];

export const niveis: Record<string, string[]> = {
  "Fundamental - Séries Iniciais": ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano"],
  "Fundamental - Séries Finais": ["6º ano", "7º ano", "8º ano", "9º ano"],
  "Ensino Médio": ["1ª série", "2ª série", "3ª série"],
};
