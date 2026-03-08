import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen, Brain, Gamepad2, Presentation, FileCheck,
  Stamp, Clock, Sparkles, CheckCircle2, ArrowRight, ChevronDown,
  Zap, Shield, Users, Star, Crown, Rocket } from
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
    desc: "Mais de 15 tipos de jogos educativos prontos para imprimir: caça-palavras, cruzadinha, sudoku, anagrama, labirinto, criptograma, complete a palavra, classifique, verdadeiro ou falso e muito mais.",
    tag: "15+ jogos",
    highlights: ["Caça-palavras", "Cruzadinha", "Sudoku"]
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
    features: ["5 créditos únicos", "Acesso a todos os módulos", "Exportação PDF", "Com marca d'água"],
    cta: "Começar grátis"
  },
  {
    name: "Pro", price: "R$ 18,67", originalPrice: "R$ 24,90", period: "/mês", icon: Zap,
    color: "text-primary", logo: planPro,
    features: ["15 créditos/mês", "1 Timbre Escolar", "Sem marca d'água", "Suporte via e-mail"],
    cta: "Assinar Pro"
  },
  {
    name: "Master", price: "R$ 33,67", originalPrice: "R$ 44,90", period: "/mês", icon: Crown,
    color: "text-plan-pratico", popular: true, logo: planMaster,
    features: ["50 créditos/mês", "Até 3 Timbres (Multiescolas)", "Sem marca d'água", "Suporte prioritário"],
    cta: "Assinar Master"
  },
  {
    name: "Ultra", price: "R$ 67,42", originalPrice: "R$ 89,90", period: "/mês", icon: Rocket,
    color: "text-plan-mestre", logo: planUltra,
    features: ["Créditos Ilimitados", "Timbres Ilimitados", "Sem marca d'água", "Suporte via WhatsApp"],
    cta: "Assinar Ultra"
  }
];

const faqs = [
  { q: "Preciso de cartão de crédito para começar?", a: "Não! O plano Starter é totalmente gratuito e não requer cartão de crédito. Você recebe 5 créditos para experimentar todos os módulos da plataforma." },
  { q: "O que é um crédito e como funciona?", a: "Cada geração de conteúdo por IA consome 1 crédito: plano de aula, jogo pedagógico, apresentação de slides ou correção de prova. Os planos pagos (Pro, Master, Ultra) renovam os créditos automaticamente todo mês." },
  { q: "Posso usar no celular e no computador?", a: "Sim! O GoPedagoX é 100% responsivo e funciona em qualquer navegador — computador, tablet ou celular. Não precisa instalar nada." },
  { q: "As habilidades BNCC estão atualizadas?", a: "Sim, mantemos nosso banco de habilidades sempre atualizado conforme as diretrizes mais recentes do MEC. O sistema cobre Educação Infantil, Ensino Fundamental e Ensino Médio." },
  { q: "Posso cancelar minha assinatura a qualquer momento?", a: "Sim, sem multa ou fidelidade. Você cancela quando quiser e continua usando todos os recursos do plano até o fim do período já pago." },
  { q: "Como funciona a correção de provas por foto?", a: "Você cria a prova na plataforma, imprime com QR Code e gabarito OMR. Depois da aplicação, tire foto ou faça upload dos gabaritos preenchidos. A IA lê as respostas, identifica a versão da prova e calcula a nota automaticamente." },
  { q: "Os materiais gerados pela IA são confiáveis?", a: "Os conteúdos são gerados por modelos avançados de IA e alinhados à BNCC, mas recomendamos que o professor sempre revise o material antes de aplicar em sala de aula. A responsabilidade pedagógica final é do docente." },
  { q: "O que acontece com meus créditos se eu trocar de plano?", a: "Ao fazer upgrade, você recebe imediatamente os créditos do novo plano. Ao fazer downgrade, a mudança ocorre no próximo ciclo de faturamento." },
  { q: "Como funciona o cupom GOPEDAGOX?", a: "O cupom GOPEDAGOX oferece 25% de desconto em qualquer plano pago (Pro, Master ou Ultra). Basta inserir o código no momento da assinatura. O desconto é aplicado em todos os ciclos de pagamento." }
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-20 items-center justify-between">
          <div className="flex items-center gap-3 md:hidden">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link to="/">
              <img src={logoHeader} alt="GoPedagoX" className="h-10 w-auto" />
            </Link>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden md:block">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="gradient-primary border-0 text-primary-foreground hover:opacity-90">Criar conta</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        <div className="gradient-hero">
          <div className="container relative z-10 flex flex-col items-center py-24 text-center md:py-32 lg:py-40">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.h1 variants={fadeUp} className="mx-auto max-w-4xl font-display text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                Seu planejamento pedagógico em{" "}
                <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">1 clique</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/70 md:text-xl">
                Plano BNCC • Atividades A4 • Slides • Jogos pedagógicos • Correção por foto.
                Tudo o que você precisa para planejar aulas incríveis.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link to="/register">
                  <Button size="lg" className="gradient-primary border-0 text-primary-foreground px-8 text-base hover:opacity-90 shadow-elevated">
                    Começar grátis <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 px-8 text-base">
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
      <section className="py-20 bg-background">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold md:text-4xl">Quanto tempo você gasta planejando?</motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-muted-foreground text-lg">Compare o antes e depois do GoPedagoX</motion.p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="h-8 w-8 text-destructive" />
                <h3 className="font-display text-xl font-bold text-destructive">Sem GoPedagoX</h3>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                {["4h para um plano de aula", "2h formatando atividades", "1h buscando habilidades BNCC", "Jogos? Só comprando pronto", "Correção manual: noite toda"].map((t) =>
                  <li key={t} className="flex items-start gap-2"><span className="text-destructive mt-1">✕</span>{t}</li>
                )}
              </ul>
              <p className="mt-6 font-display text-2xl font-bold text-destructive">~10h/semana</p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-8 w-8 text-primary" />
                <h3 className="font-display text-xl font-bold text-primary">Com GoPedagoX</h3>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                {["Plano BNCC em 2 minutos", "Atividades auto-formatadas", "Habilidades sugeridas por IA", "20 jogos prontos para imprimir", "Correção por foto em segundos"].map((t) =>
                  <li key={t} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-1 shrink-0" />{t}</li>
                )}
              </ul>
              <p className="mt-6 font-display text-2xl font-bold text-primary">~1h/semana</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-secondary/50">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold md:text-4xl">Tudo em uma plataforma</motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-muted-foreground text-lg">5 módulos integrados para o professor completo</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) =>
              <motion.div key={f.title} variants={fadeUp} className="group relative rounded-2xl border bg-card p-6 shadow-card hover:shadow-elevated transition-all hover:-translate-y-1">
                {f.tag && (
                  <span className="absolute top-4 right-4 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {f.tag}
                  </span>
                )}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:gradient-primary group-hover:text-primary-foreground transition-all">
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
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-background">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold md:text-4xl">Planos para cada necessidade</motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-muted-foreground text-lg">Comece grátis, evolua quando precisar</motion.p>
            <motion.div variants={fadeUp} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Use o cupom <span className="font-bold">GOPEDAGOX</span> e ganhe 25% de desconto!</span>
            </motion.div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) =>
              <motion.div key={plan.name} variants={fadeUp} className={`relative rounded-2xl border p-6 bg-card shadow-card ${plan.popular ? "border-primary ring-2 ring-primary/20" : ""}`}>
                {plan.popular &&
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    MAIS POPULAR
                  </div>
                }
                {plan.originalPrice &&
                  <div className="absolute top-3 right-3 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                    -25%
                  </div>
                }
                <div className="mb-4 flex justify-center">
                  <img src={plan.logo} alt={plan.name} className="h-16 w-auto object-contain" />
                </div>
                <h3 className="font-display text-lg font-bold text-center">{plan.name}</h3>
                <div className="mt-2 text-center">
                  {plan.originalPrice &&
                    <p className="text-sm text-muted-foreground line-through">{plan.originalPrice}</p>
                  }
                  <div className="flex items-baseline gap-1 justify-center">
                    <span className="font-display text-3xl font-extrabold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) =>
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  )}
                </ul>
                <Link to="/register" className="mt-6 block">
                  <Button className={`w-full ${plan.popular ? "gradient-primary border-0 text-primary-foreground hover:opacity-90" : ""}`} variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-secondary/50">
        <div className="container max-w-3xl">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center font-display text-3xl font-bold md:text-4xl mb-12">
            Perguntas frequentes
          </motion.h2>
          <div className="space-y-3">
            {faqs.map((faq, i) =>
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-xl border bg-card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between p-5 text-left font-medium hover:bg-secondary/50 transition-colors">
                  {faq.q}
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform shrink-0 ml-2 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <img src={logoGoPedagoX} alt="GoPedagoX" className="h-10 w-auto" />
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
              <Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
              <a href="mailto:contato@gopedagox.com" className="hover:text-foreground transition-colors">Contato</a>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 GoPedagoX. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
