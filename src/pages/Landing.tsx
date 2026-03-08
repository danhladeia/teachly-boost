import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen, Brain, Gamepad2, Presentation, FileCheck, Calendar,
  Sparkles, CheckCircle2, ArrowRight, ChevronDown,
  Zap, Clock, HelpCircle, Shield, CreditCard, Bot, Printer, FileText, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import bannerGoPedagoX from "@/assets/banner-gopedagox.png";
import logoGoPedagoX from "@/assets/logo-gopedagox.png";
import planStarter from "@/assets/plan-starter.png";
import planPro from "@/assets/plan-pro.png";
import planMaster from "@/assets/plan-master.png";
import planUltra from "@/assets/plan-ultra.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const features = [
  { icon: BookOpen, title: "Planejador BNCC", desc: "Planos de aula alinhados à BNCC com IA em segundos" },
  { icon: FileCheck, title: "Atividades A4", desc: "Gere atividades com layout profissional automaticamente" },
  { icon: Presentation, title: "Gerador de Slides", desc: "Apresentações prontas para projetar na sala de aula" },
  { icon: Gamepad2, title: "Fábrica de Jogos", desc: "20 tipos de jogos pedagógicos para imprimir" },
  { icon: Brain, title: "Provas e Correção", desc: "Crie provas e corrija por foto com IA" },
  { icon: Calendar, title: "Sequência Didática", desc: "Planejamento integrado de dias letivos completos" },
];

const plans = [
  {
    name: "Starter", priceBase: null, priceWithCoupon: null, priceDisplay: "Grátis", period: "", image: planStarter,
    features: ["5 créditos únicos", "Acesso a todos os módulos", "Exportação PDF", "Com marca d'água"],
    cta: "Começar grátis",
  },
  {
    name: "Pro", priceBase: "R$ 24,90", priceWithCoupon: "R$ 18,67", priceDisplay: "R$ 24,90", period: "/mês", image: planPro,
    features: ["15 créditos/mês", "1 Timbre Escolar", "Sem marca d'água", "Suporte via e-mail"],
    cta: "Assinar Pro",
  },
  {
    name: "Master", priceBase: "R$ 44,90", priceWithCoupon: "R$ 33,67", priceDisplay: "R$ 44,90", period: "/mês", image: planMaster,
    popular: true,
    features: ["50 créditos/mês", "Até 3 Timbres (Multiescolas)", "Sem marca d'água", "Suporte prioritário"],
    cta: "Assinar Master",
  },
  {
    name: "Ultra", priceBase: "R$ 89,90", priceWithCoupon: "R$ 67,42", priceDisplay: "R$ 89,90", period: "/mês", image: planUltra,
    features: ["Créditos Ilimitados", "Timbres Ilimitados", "Sem marca d'água", "Suporte via WhatsApp"],
    cta: "Assinar Ultra",
  },
];

const faqs = [
  { icon: CreditCard, q: "Preciso de cartão de crédito para começar?", a: "Não! O plano Starter não requer cartão. Você recebe 5 créditos grátis para experimentar todos os módulos da plataforma." },
  { icon: HelpCircle, q: "O que é um crédito?", a: "Cada geração de IA (plano de aula, jogo, slides, correção de prova) consome 1 crédito. No plano Starter os créditos são únicos; nos planos pagos eles renovam todo mês." },
  { icon: Bot, q: "A IA gera conteúdos confiáveis?", a: "Nossos conteúdos são gerados por modelos avançados de IA e alinhados à BNCC. No entanto, recomendamos sempre que o professor revise o material antes de aplicar em sala de aula." },
  { icon: Printer, q: "Posso imprimir os materiais gerados?", a: "Sim! Todos os jogos, atividades e provas são otimizados para impressão em formato A4. Planos pagos geram materiais sem marca d'água." },
  { icon: Shield, q: "Meus dados estão seguros?", a: "Sim. Utilizamos criptografia de ponta a ponta e políticas de isolamento de dados que garantem que nenhum professor veja os materiais de outro. Estamos em conformidade com a LGPD." },
  { icon: FileText, q: "Posso cancelar minha assinatura?", a: "Sim, a qualquer momento, sem multa. Você mantém acesso ao plano até o fim do ciclo já pago e depois é revertido ao plano Starter." },
  { icon: Gamepad2, q: "Quantos tipos de jogos estão disponíveis?", a: "Atualmente oferecemos 20 tipos de jogos pedagógicos, incluindo Caça-Palavras, Palavras Cruzadas, Criptograma, Sudoku, Labirinto e muitos outros." },
  { icon: BookOpen, q: "As habilidades BNCC estão atualizadas?", a: "Sim! Mantemos nosso banco de habilidades sempre atualizado conforme as diretrizes do MEC para todas as etapas e disciplinas." },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoGoPedagoX} alt="GoPedagoX" className="h-10 w-auto" />
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="gradient-primary border-0 text-primary-foreground hover:opacity-90">Criar conta</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - Large Banner Image */}
      <section className="relative overflow-hidden pt-16">
        <div className="gradient-hero">
          <div className="container relative z-10 flex flex-col items-center py-16 text-center md:py-24 lg:py-28">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="w-full">
              <motion.div variants={fadeUp} className="mb-8">
                <img src={bannerGoPedagoX} alt="GoPedagoX" className="mx-auto w-full max-w-3xl drop-shadow-2xl" />
              </motion.div>
              <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary-foreground/80">
                <Zap className="h-4 w-4" /> Planejamento com IA • 100% alinhado à BNCC
              </motion.div>
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
                {["4h para um plano de aula", "2h formatando atividades", "1h buscando habilidades BNCC", "Jogos? Só comprando pronto", "Correção manual: noite toda"].map((t) => (
                  <li key={t} className="flex items-start gap-2"><span className="text-destructive mt-1">✕</span>{t}</li>
                ))}
              </ul>
              <p className="mt-6 font-display text-2xl font-bold text-destructive">~10h/semana</p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-8 w-8 text-primary" />
                <h3 className="font-display text-xl font-bold text-primary">Com GoPedagoX</h3>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                {["Plano BNCC em 2 minutos", "Atividades auto-formatadas", "Habilidades sugeridas por IA", "20 jogos prontos para imprimir", "Correção por foto em segundos"].map((t) => (
                  <li key={t} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-1 shrink-0" />{t}</li>
                ))}
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
            <motion.p variants={fadeUp} className="mt-3 text-muted-foreground text-lg">6 módulos integrados para o professor completo</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp} className="group rounded-2xl border bg-card p-6 shadow-card hover:shadow-elevated transition-shadow">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:gradient-primary group-hover:text-primary-foreground transition-all">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-background">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-6">
            <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold md:text-4xl">Planos para cada necessidade</motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-muted-foreground text-lg">Comece grátis, evolua quando precisar</motion.p>
          </motion.div>

          {/* Coupon banner */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-xl mx-auto mb-10">
            <div className="rounded-xl border-2 border-dashed border-green-500/50 bg-green-50 dark:bg-green-950/20 p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Tag className="h-5 w-5 text-green-600" />
                <span className="font-display text-lg font-bold text-green-700 dark:text-green-400">25% OFF com o cupom</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-green-100 dark:bg-green-900/40 px-4 py-2 border border-green-300 dark:border-green-700">
                <span className="font-mono text-xl font-extrabold tracking-widest text-green-800 dark:text-green-300">GOPEDAGOX</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-500 mt-2">Aplique na página de planos após criar sua conta</p>
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <motion.div key={plan.name} variants={fadeUp} className={`relative rounded-2xl border p-6 bg-card shadow-card ${plan.popular ? "border-primary ring-2 ring-primary/20" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    MAIS POPULAR
                  </div>
                )}
                <div className="flex justify-center mb-4">
                  <img src={plan.image} alt={`Plano ${plan.name}`} className="h-24 w-auto" />
                </div>
                <div className="text-center">
                  {plan.priceBase ? (
                    <>
                      <p className="text-sm text-muted-foreground line-through">{plan.priceBase}</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="font-display text-3xl font-extrabold text-green-600">{plan.priceWithCoupon}</span>
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      </div>
                      <Badge variant="secondary" className="mt-1 text-green-600 bg-green-50 dark:bg-green-950/30 text-[10px]">
                        com cupom GOPEDAGOX
                      </Badge>
                    </>
                  ) : (
                    <span className="font-display text-3xl font-extrabold">{plan.priceDisplay}</span>
                  )}
                </div>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="mt-6 block">
                  <Button className={`w-full ${plan.popular ? "gradient-primary border-0 text-primary-foreground hover:opacity-90" : ""}`} variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-secondary/50">
        <div className="container max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold md:text-4xl">Perguntas frequentes</motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-muted-foreground text-lg">Tire suas dúvidas sobre o GoPedagoX</motion.p>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-xl border bg-card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center gap-3 p-5 text-left font-medium hover:bg-secondary/50 transition-colors">
                  <faq.icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="flex-1">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform shrink-0 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-5 pl-13 text-sm text-muted-foreground">{faq.a}</div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
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
