import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Presentation, Sparkles, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import SlideConfigPanel from "@/components/slides/SlideConfigPanel";
import SlideEditor from "@/components/slides/SlideEditor";
import EditorTopBar from "@/components/EditorTopBar";
import type { Slide, SlideTemplate, SlideDensity } from "@/components/slides/types";
import { estilosImagem } from "@/components/slides/types";
import type { TimbreData } from "@/hooks/useTimbre";

export default function SlidesGenerator() {
  const location = useLocation();
  const [tema, setTema] = useState("");
  const [descricao, setDescricao] = useState("");
  const [textoBase, setTextoBase] = useState("");
  const [nivel, setNivel] = useState("");
  const [serie, setSerie] = useState("");
  const [template, setTemplate] = useState<SlideTemplate>("moderno");
  const [numSlides, setNumSlides] = useState(8);
  const [densidade, setDensidade] = useState<SlideDensity>("visual");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [estiloImagem, setEstiloImagem] = useState("realistic");
  const [gerarImagens, setGerarImagens] = useState(true);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [imageTotal, setImageTotal] = useState(0);
  const [selectedTimbre, setSelectedTimbre] = useState<TimbreData | null>(null);
  const [professor, setProfessor] = useState("");
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  // Load document from Library navigation
  useEffect(() => {
    const state = location.state as { loadDocId?: string; source?: string } | null;
    if (state?.loadDocId && state?.source === "documentos") {
      loadDocumentById(state.loadDocId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadDocumentById = async (docId: string) => {
    try {
      const { data, error } = await supabase
        .from("documentos_salvos")
        .select("*")
        .eq("id", docId)
        .single();
      if (error) throw error;
      if (data?.conteudo) {
        const content = data.conteudo as any;
        if (Array.isArray(content)) {
          setSlides(content);
        } else if (content.slides) {
          setSlides(content.slides);
        }
        setCurrentDocId(docId);
        setTema(data.titulo || "");
        toast.success(`Apresentação "${data.titulo}" carregada!`);
      }
    } catch (err) {
      console.error("Error loading document:", err);
      toast.error("Erro ao carregar apresentação");
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("nome").eq("user_id", user.id).single();
      if (data?.nome) setProfessor(data.nome);
    } catch {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setArquivo(file);
  };
  const generateImageForSlide = async (slide: Slide, style: string): Promise<string | undefined> => {
    if (!slide.image_prompt) return undefined;
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: slide.image_prompt, style },
      });
      if (error) throw error;
      return data?.image_url || undefined;
    } catch (err) {
      console.error("Image generation failed:", err);
      return undefined;
    }
  };

  const { canUseAI, deductCredit } = useCredits();

  const handleGenerate = async () => {
    if (!tema.trim()) { toast.error("Insira o tema da aula"); return; }
    if (!canUseAI) { toast.error("Limite atingido. Faça o upgrade para continuar criando."); return; }
    setLoading(true);
    try {
      const ok = await deductCredit();
      if (!ok) { toast.error("Sem créditos disponíveis."); setLoading(false); return; }
      const estiloLabel = estilosImagem.find(e => e.value === estiloImagem)?.label || "Realista";
      const { data, error } = await supabase.functions.invoke("generate-slides", {
        body: {
          tema, descricao, nivel,
          serie: serie ? `${nivel} - ${serie}` : nivel,
          template, num_slides: numSlides,
          estilo_imagem: estiloLabel,
          densidade, texto_base: textoBase,
        },
      });
      if (error) throw error;
      if (data?.slides?.length) {
        setSlides(data.slides);

        if (gerarImagens) {
          toast.success(`${data.slides.length} slides gerados! Gerando imagens...`);
          setGeneratingImages(true);
          const withPrompts = data.slides.filter((s: Slide) => s.image_prompt && s.layout !== "title");
          setImageTotal(withPrompts.length);
          setImageProgress(0);

          const updated = [...data.slides];
          for (let i = 0; i < updated.length; i++) {
            const s = updated[i];
            if (s.image_prompt && s.layout !== "title") {
              const imgUrl = await generateImageForSlide(s, estiloLabel);
              if (imgUrl) {
                updated[i] = { ...s, image_url: imgUrl };
                setSlides([...updated]);
              }
              setImageProgress(prev => prev + 1);
            }
          }
          setGeneratingImages(false);
          toast.success("Imagens geradas!");
        } else {
          toast.success(`${data.slides.length} slides gerados!`);
        }
      } else {
        toast.error("Nenhum slide gerado");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar slides");
    } finally {
      setLoading(false);
      setGeneratingImages(false);
    }
  };

  return (
    <div className="space-y-4">
      {slides.length > 0 && (
        <EditorTopBar
          title="Gerador de Slides"
          onPrint={() => (window as any).__slidesPrintHandout?.()}
          onPptx={() => (window as any).__slidesExportPPTX?.()}
          leading={
            <button
              onClick={() => setSlides([])}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Nova Apresentação
            </button>
          }
        />
      )}
      
      {slides.length === 0 && (
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Presentation className="h-6 w-6 text-primary" /> Gerador de Slides
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Apresentações pedagógicas com imagens IA, exportação PPTX e modo handout</p>
        </div>
      )}

      {/* Recommendation banner */}
      <div className="flex items-center gap-3 rounded-lg border border-muted-foreground/20 bg-muted/50 px-4 py-2.5">
        <p className="text-muted-foreground text-xs">
          💡 Recomenda-se gerar os slides e editá-los no <strong>PowerPoint</strong> ou <strong>Google Slides</strong> para melhor personalização.
        </p>
      </div>

      {slides.length === 0 ? (
        <div className="max-w-2xl">
          <SlideConfigPanel
            tema={tema} setTema={setTema}
            descricao={descricao} setDescricao={setDescricao}
            textoBase={textoBase} setTextoBase={setTextoBase}
            nivel={nivel} setNivel={setNivel}
            serie={serie} setSerie={setSerie}
            template={template} setTemplate={setTemplate}
            numSlides={numSlides} setNumSlides={setNumSlides}
            densidade={densidade} setDensidade={setDensidade}
            estiloImagem={estiloImagem} setEstiloImagem={setEstiloImagem}
            gerarImagens={gerarImagens} setGerarImagens={setGerarImagens}
            loading={loading} onGenerate={handleGenerate}
            onFileUpload={handleFileUpload} arquivo={arquivo}
            selectedTimbre={selectedTimbre}
            onTimbreSelect={setSelectedTimbre}
            professor={professor}
            setProfessor={setProfessor}
          />
        </div>
      ) : (
        <SlideEditor
          slides={slides} setSlides={setSlides}
          template={template} setTemplate={setTemplate}
          onReset={() => setSlides([])}
          generatingImages={generatingImages}
          imageProgress={imageProgress}
          imageTotal={imageTotal}
          onPrint={(printFn) => {
            // Store the print function to use in the top bar
            (window as any).__slidesPrintHandout = printFn;
          }}
          onPptx={(pptxFn) => {
            // Store the PPTX function to use in the top bar 
            (window as any).__slidesExportPPTX = pptxFn;
          }}
        />
      )}
    </div>
  );
}
