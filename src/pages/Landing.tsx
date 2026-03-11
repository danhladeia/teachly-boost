import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen, Brain, Gamepad2, Presentation, FileCheck, GitBranch,
  Clock, Sparkles, CheckCircle2, ArrowRight, ChevronDown,
  Zap, Star, Crown, Rocket } from
"lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import logoGoPedagoX from "@/assets/logo-gopedagox.png";
import logoHeader from "@/assets/logo-gopedagox-header.png";
import planStarter from "@/assets/plan-starter.png";
import planPro from "@/assets/plan-pro.png";
import planMaster from "@/assets/plan-master.png";
import planUltra from "@/assets/plan-ultra.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

const features = [
  {
    icon: BookOpen,
    title: "Planejador BNCC",
    desc: "Gere planos de aula completos e alinhados à Base Nacional Comum Curricular em segundos. Inclui objetivos de aprendizagem, metodologia ativa, recursos didáticos e critérios de avaliação. Exporte em PDF ou DOCX.",
    tag: "IA",
    highlights: ["Alinhado à BNCC", "PDF e DOCX", "Metodologia ativa"]
  },
  {
    icon: FileCheck,
    title: "Atividades Impressas A4",
    desc: "Crie atividades com layout profissional prontas para imprimir. Cabeçalho personalizado com timbre da escola, questões variadas (múltipla escolha, dissertativa, complete) e gabarito automático no verso.",
    tag: "PDF",
    highlights: ["Timbre escolar", "Gabarito automático", "Layout A4"]
  },
  {
    icon: Presentation,
    title: "Gerador de Slides",
    desc: "Apresentações completas com design moderno geradas por IA. Escolha o tema, quantidade de slides, paleta de cores e exporte em PPTX pronto para projetar na sala de aula.",
    tag: "IA",
    highlights: ["Export PPTX", "Temas variados", "Design moderno"]
  },
  {
    icon: Gamepad2,
    title: "Fábrica de Jogos Pedagógicos",
    desc: "Diversos jogos educativos prontos para imprimir em A4 com níveis de dificuldade e gabarito automático. Ideal para fixação de conteúdo de forma lúdica e engajadora.",
    tag: "Jogos",
    highlights: ["Imprimíveis A4", "Gabarito automático", "Níveis de dificuldade"]
  },
  {
    icon: GitBranch,
    title: "Gerador de Diagramas",
    desc: "Crie fluxogramas, mapas mentais, diagramas de sequência e muito mais com IA. Visualize conceitos complexos de forma clara e exporte em PDF, DOCX ou PPTX com escala automática para folha A4.",
    tag: "IA",
    highlights: ["Fluxogramas", "Mapas mentais", "Export PDF/DOCX"]
  },
  {
    icon: Brain,
    title: "Provas com Correção por Foto",
    desc: "Crie provas com questões objetivas e dissertativas. Embaralhe automaticamente para gerar versões A, B e C com QR Code. Envie fotos das folhas de respostas e a IA corrige automaticamente, com validação assistida pelo professor.",
    tag: "IA",
    highlights: ["Versões A/B/C", "Correção por foto", "Validação assistida"]
  }
];

const plans = [
  {
    name: "Starter", price: "R$ 0,00", originalPrice: null, period: "", icon: Star,
    color: "text-muted-foreground", logo: planStarter,
    features: ["10 créditos únicos", "10 correções de prova", "Até 20 documentos salvos", "Acesso a todos os módulos", "Exportação PDF", "Suporte via ticket"],
    cta: "Começar grátis"
  },
  {
    name: "Pro", price: "R$ 19,90", originalPrice: null, period: "/mês", icon: Zap,
    color: "text-primary", logo: planPro,
    features: ["30 créditos/mês", "50 correções de prova/mês", "Até 150 documentos salvos", "1 Timbre Escolar", "Suporte via ticket"],
    cta: "Assinar Pro"
  },
  {
    name: "Master", price: "R$ 34,90", originalPrice: null, period: "/mês", icon: Crown,
    color: "text-plan-pratico", popular: true, logo: planMaster,
    features: ["60 créditos/mês", "100 correções de prova/mês", "Até 500 documentos salvos", "Até 3 Timbres (Multiescolas)", "Suporte prioritário via ticket"],
    cta: "Assinar Master"
  },
  {
    name: "Ultra", price: "R$ 69,90", originalPrice: null, period: "/mês", icon: Rocket,
    color: "text-plan-mestre", logo: planUltra,
    features: ["Créditos e Correções Ilimitados", "Documentos Ilimitados", "Timbres Ilimitados", "Suporte prioritário via ticket e WhatsApp"],
    cta: "Assinar Ultra"
  }
];

const faqs = [
  { q: "Preciso de cartão de crédito para começar?", a: "Não! O plano Starter é totalmente gratuito e não requer cartão de crédito. Você recebe 10 créditos de criação e 10 correções de prova para experimentar todos os módulos da plataforma." },
  { q: "O que é um crédito e como funciona?", a: "Existem dois tipos de créditos: créditos de criação (para Planos BNCC, Jogos, Slides e Diagramas) e créditos de correção (para provas OMR). Cada geração ou correção consome 1 crédito do tipo correspondente. Os planos pagos (Pro, Master, Ultra) renovam os créditos automaticamente todo mês." },
  { q: "Posso usar no celular e no computador?", a: "Sim! O GoPedagoX é 100% responsivo e funciona em qualquer navegador — computador, tablet ou celular. Não precisa instalar nada." },
  { q: "As habilidades BNCC estão atualizadas?", a: "Sim, mantemos nosso banco de habilidades sempre atualizado conforme as diretrizes mais recentes do MEC. O sistema cobre Educação Infantil, Ensino Fundamental e Ensino Médio." },
  { q: "Posso cancelar minha assinatura a qualquer momento?", a: "Sim, sem multa ou fidelidade. Você cancela quando quiser e continua usando todos os recursos do plano até o fim do período já pago." },
  { q: "Como funciona a correção de provas por foto?", a: "Você cria a prova na plataforma, imprime com QR Code e gabarito OMR. Depois da aplicação, tire foto ou faça upload dos gabaritos preenchidos. A IA lê as respostas, identifica a versão da prova e calcula a nota automaticamente." },
  { q: "Os materiais gerados pela IA são confiáveis?", a: "Os conteúdos são gerados por modelos avançados de IA e alinhados à BNCC, mas recomendamos que o professor sempre revise o material antes de aplicar em sala de aula. A responsabilidade pedagógica final é do docente." },
  { q: "O que acontece com meus créditos se eu trocar de plano?", a: "Ao fazer upgrade, você recebe imediatamente os créditos do novo plano. Ao fazer downgrade, a mudança ocorre no próximo ciclo de faturamento." },
  { q: "Como funciona o cupom GOPEDAGOX?", a: "O cupom GOPEDAGOX oferece 25% de desconto em qualquer plano pago (Pro, Master ou Ultra) por tempo limitado. Basta inserir o código no momento da assinatura. O desconto é aplicado em todos os ciclos de pagamento enquanto o cupom estiver ativo. Aproveite antes que expire!" }
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg" aria-label="Navegação principal">
        <div className="container flex h-20 items-center justify-between">
          <div className="flex items-center gap-3 md:hidden">
            <Link to="/login" aria-label="Entrar na plataforma GoPedagoX">
              <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px]">Entrar</Button>
            </Link>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link to="/" aria-label="GoPedagoX — Página inicial">
              <img
                src={logoHeader}
                alt="GoPedagoX — Plataforma de IA para Professores"
                className="h-5 sm:h-7 w-auto"
                width="180"
                height="28"
                fetchPriority="high"
              />
            </Link>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos e Preços</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Perguntas Frequentes</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden md:block" aria-label="Entrar na plataforma GoPedagoX">
              <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px]">Entrar</Button>
            </Link>
            <Link to="/register" aria-label="Criar conta gratuita no GoPedagoX">
              <Button size="sm" className="gradient-primary border-0 text-primary-foreground hover:opacity-90 min-h-[44px]">Criar conta</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16" aria-label="Apresentação do GoPedagoX">
        <div className="gradient-hero">
          <div className="container relative z-10 flex flex-col items-center py-24 text-center md:py-32 lg:py-40">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.h1 variants={fadeUp} className="mx-auto max-w-4xl font-display text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                Seu planejamento pedagógico com IA em{" "}
                <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">1 clique</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/70 md:text-xl">
                Plano de aula BNCC • Atividades A4 • Slides educativos • Jogos pedagógicos • Correção de provas por foto.
                Tudo o que você precisa para planejar aulas incríveis com inteligência artificial.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link to="/register" aria-label="Criar conta gratuita e começar a usar o GoPedagoX">
                  <Button size="lg" className="gradient-primary border-0 text-primary-foreground px-8 text-base hover:opacity-90 shadow-elevated min-h-[44px]">
                    Começar grátis <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                  </Button>
                </Link>
                <a href="#features" aria-label="Ver todos os recursos do GoPedagoX">
                  <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 px-8 text-base min-h-[44px]">
                    Ver recursos
                  </Button>
                </a>
              </motion.div>
              <motion.p variants={fadeUp} className="mt-4 text-sm text-primary-foreground/50">
                5 créditos grátis • Sem cartão de crédito
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 bg-background" aria-label="Comparação de tempo com e sem GoPedagoX">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold md:text-4xl">Quanto tempo você gasta planejando aulas?</motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-muted-foreground text-lg">Compare o antes e depois do GoPedagoX na rotina do professor</motion.p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="h-8 w-8 text-destructive" aria-hidden="true" />
                <h3 className="font-display text-xl font-bold text-destructive">Sem GoPedagoX</h3>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                {["4h para um plano de aula", "2h formatando atividades", "1h buscando habilidades BNCC", "Jogos? Só comprando pronto", "Correção manual: noite toda"].map((t) =>
                  <li key={t} className="flex items-start gap-2"><span className="text-destructive mt-1" aria-hidden="true">✕</span>{t}</li>
                )}
              </ul>
              <p className="mt-6 font-display text-2xl font-bold text-destructive" aria-label="Tempo gasto sem GoPedagoX: aproximadamente 10 horas por semana">~10h/semana</p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-8 w-8 text-primary" aria-hidden="true" />
                <h3 className="font-display text-xl font-bold text-primary">Com GoPedagoX</h3>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                {["Plano BNCC em 2 minutos", "Atividades auto-formatadas", "Habilidades sugeridas por IA", "17+ jogos prontos para imprimir", "Correção por foto em segundos"].map((t) =>
                  <li key={t} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-1 shrink-0" aria-hidden="true" />{t}</li>
                )}
              </ul>
              <p className="mt-6 font-display text-2xl font-bold text-primary" aria-label="Tempo gasto com GoPedagoX: aproximadamente 1 hora por semana">~1h/semana</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-secondary/50" aria-label="Módulos e recursos do GoPedagoX">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold md:text-4xl">Todos os recursos em uma plataforma pedagógica</motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-muted-foreground text-lg">6 módulos integrados com inteligência artificial para o professor completo</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) =>
              <motion.article key={f.title} variants={fadeUp} className="group relative rounded-2xl border bg-card p-6 shadow-card hover:shadow-elevated transition-all hover:-translate-y-1">
                {f.tag && (
                  <span className="absolute top-4 right-4 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary" aria-label={`Tipo: ${f.tag}`}>
                    {f.tag}
                  </span>
                )}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:gradient-primary group-hover:text-primary-foreground transition-all" aria-hidden="true">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {f.highlights.map((h) => (
                    <span key={h} className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {h}
                    </span>
                  ))}
                </div>
              </motion.article>
            )}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-background" aria-label="Planos e preços do GoPedagoX">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold md:text-4xl">Planos e preços para cada necessidade</motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-muted-foreground text-lg">Comece grátis, evolua quando precisar</motion.p>
            <motion.div variants={fadeUp} className="mt-4 inline-flex items-center gap-2 rounded-2xl border-2 border-destructive/40 bg-destructive/10 px-6 py-3 shadow-lg animate-pulse">
              <Sparkles className="h-5 w-5 text-destructive" aria-hidden="true" />
              <span className="text-sm font-bold text-destructive">⏰ TEMPO LIMITADO: use o cupom <span className="rounded bg-destructive px-2 py-0.5 text-destructive-foreground font-extrabold">GOPEDAGOX</span> e ganhe 25% OFF em qualquer plano!</span>
            </motion.div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) =>
              <motion.article key={plan.name} variants={fadeUp} className={`relative rounded-2xl border p-6 bg-card shadow-card ${plan.popular ? "border-primary ring-2 ring-primary/20" : ""}`}>
                {plan.popular &&
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    MAIS POPULAR
                  </div>
                }
                {plan.originalPrice &&
                  <div className="absolute top-3 right-3 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive" aria-label="25% de desconto">
                    -25%
                  </div>
                }
                <div className="mb-4 flex justify-center">
                  <img
                    src={plan.logo}
                    alt={`Plano ${plan.name} do GoPedagoX`}
                    className="h-16 w-auto object-contain"
                    width="64"
                    height="64"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-display text-lg font-bold text-center">{plan.name}</h3>
                <div className="mt-2 text-center">
                  {plan.originalPrice &&
                    <p className="text-sm text-muted-foreground line-through" aria-label={`Preço original: ${plan.originalPrice}`}>{plan.originalPrice}</p>
                  }
                  <div className="flex items-baseline gap-1 justify-center">
                    <span className="font-display text-3xl font-extrabold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="mt-6 space-y-2.5" aria-label={`Recursos do plano ${plan.name}`}>
                  {plan.features.map((f) =>
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  )}
                </ul>
                <Link to="/register" className="mt-6 block" aria-label={`${plan.cta} — Plano ${plan.name}`}>
                  <Button className={`w-full min-h-[44px] ${plan.popular ? "gradient-primary border-0 text-primary-foreground hover:opacity-90" : ""}`} variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>
              </motion.article>
            )}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-secondary/50" aria-label="Perguntas frequentes sobre o GoPedagoX">
        <div className="container max-w-3xl">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center font-display text-3xl font-bold md:text-4xl mb-12">
            Perguntas frequentes sobre o GoPedagoX
          </motion.h2>
          <div className="space-y-3" role="list">
            {faqs.map((faq, i) =>
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-xl border bg-card overflow-hidden" role="listitem">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left font-medium hover:bg-secondary/50 transition-colors min-h-[44px]"
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  {faq.q}
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform shrink-0 ml-2 ${openFaq === i ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                {openFaq === i && <div id={`faq-answer-${i}`} className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed" role="region">{faq.a}</div>}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12" role="contentinfo">
        <div className="container">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <img
                src={logoGoPedagoX}
                alt="GoPedagoX — Automação pedagógica com inteligência artificial"
                className="h-10 w-auto"
                width="40"
                height="40"
                loading="lazy"
              />
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground" aria-label="Links do rodapé">
              <Link to="/termos" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">Termos de Uso</Link>
              <Link to="/privacidade" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">Política de Privacidade</Link>
              <a href="mailto:contato@gopedagox.com" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">Contato por e-mail</a>
            </nav>
            <p className="text-sm text-muted-foreground">© 2026 GoPedagoX. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
