import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen, Brain, Gamepad2, Presentation, FileCheck, Calendar,
  Stamp, Clock, Sparkles, CheckCircle2, ArrowRight, ChevronDown,
  Zap, Shield, Users, Star, Crown, Rocket } from
"lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import heroBg from "@/assets/hero-bg.jpg";
import logoGoPedagoX from "@/assets/logo-gopedagox.png";
import logoHeader from "@/assets/logo-gopedagox-header.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

const features = [
{ icon: BookOpen, title: "Planejador BNCC", desc: "Planos de aula alinhados à BNCC com IA em segundos" },
{ icon: FileCheck, title: "Atividades A4", desc: "Gere atividades com layout profissional automaticamente" },
{ icon: Presentation, title: "Gerador de Slides", desc: "Apresentações prontas para projetar na sala de aula" },
{ icon: Gamepad2, title: "Fábrica de Jogos", desc: "20 tipos de jogos pedagógicos para imprimir" },
{ icon: Brain, title: "Provas e Correção", desc: "Crie provas e corrija por foto com IA" },
{ icon: Calendar, title: "Sequência Didática", desc: "Planejamento integrado de dias letivos completos" }];


const plans = [
{
  name: "Starter", price: "R$ 0,00", originalPrice: null, period: "", icon: Star,
  color: "text-muted-foreground",
  features: ["5 créditos únicos", "Acesso a todos os módulos", "Exportação PDF", "Com marca d'água"],
  cta: "Começar grátis"
},
{
  name: "Pro", price: "R$ 18,67", originalPrice: "R$ 24,90", period: "/mês", icon: Zap,
  color: "text-primary",
  features: ["15 créditos/mês", "1 Timbre Escolar", "Sem marca d'água", "Suporte via e-mail"],
  cta: "Assinar Pro"
},
{
  name: "Master", price: "R$ 33,67", originalPrice: "R$ 44,90", period: "/mês", icon: Crown,
  color: "text-plan-pratico", popular: true,
  features: ["50 créditos/mês", "Até 3 Timbres (Multiescolas)", "Sem marca d'água", "Suporte prioritário"],
  cta: "Assinar Master"
},
{
  name: "Ultra", price: "R$ 67,42", originalPrice: "R$ 89,90", period: "/mês", icon: Rocket,
  color: "text-plan-mestre",
  features: ["Créditos Ilimitados", "Timbres Ilimitados", "Sem marca d'água", "Suporte via WhatsApp"],
  cta: "Assinar Ultra"
}];


const faqs = [
{ q: "Preciso de cartão de crédito para começar?", a: "Não! O plano Starter não requer cartão. Você recebe 5 créditos grátis para experimentar." },
{ q: "A plataforma funciona no celular?", a: "Sim! O GoPedagoX é responsivo e funciona em qualquer dispositivo." },
{ q: "As habilidades BNCC estão atualizadas?", a: "Sim, mantemos nosso banco de habilidades sempre atualizado conforme as diretrizes do MEC." },
{ q: "Posso cancelar minha assinatura a qualquer momento?", a: "Sim, sem multa ou fidelidade. Cancele quando quiser e continue usando até o fim do período pago." },
{ q: "O que é um crédito?", a: "Cada geração de IA (plano de aula, jogo, slides, correção de prova) consome 1 crédito. Planos pagos renovam mensalmente." }];


const testimonials = [
{ name: "Profª Maria Silva", school: "E.M. Paulo Freire", text: "Reduzi 4 horas de planejamento para 30 minutos. Agora tenho tempo para preparar materiais criativos!", avatar: "MS" },
{ name: "Prof. Carlos Souza", school: "Colégio Santos", text: "A fábrica de jogos é incrível. Meus alunos ficam muito mais engajados com os caça-palavras temáticos.", avatar: "CS" },
{ name: "Profª Ana Oliveira", school: "E.E. Monteiro Lobato", text: "A correção por foto mudou minha vida. Corrijo 30 provas em menos de 10 minutos.", avatar: "AO" }];


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
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mt-16 w-full max-w-5xl">
              <img src={heroBg} alt="GoPedagoX plataforma" className="w-full rounded-2xl shadow-elevated border border-white/10" />
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
            <motion.p variants={fadeUp} className="mt-3 text-muted-foreground text-lg">6 módulos integrados para o professor completo</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) =>
            <motion.div key={f.title} variants={fadeUp} className="group rounded-2xl border bg-card p-6 shadow-card hover:shadow-elevated transition-shadow">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:gradient-primary group-hover:text-primary-foreground transition-all">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
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
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) =>
            <motion.div key={plan.name} variants={fadeUp} className={`relative rounded-2xl border p-6 bg-card shadow-card ${plan.popular ? "border-primary ring-2 ring-primary/20" : ""}`}>
                {plan.popular &&
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    MAIS POPULAR
                  </div>
              }
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <plan.icon className={`h-5 w-5 ${plan.color}`} />
                </div>
                <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                <div className="mt-2">
                  {plan.originalPrice &&
                <p className="text-sm text-muted-foreground line-through">{plan.originalPrice}</p>
                }
                  <div className="flex items-baseline gap-1">
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

      {/* Testimonials */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center font-display text-3xl font-bold md:text-4xl mb-12">
            O que professores dizem
          </motion.h2>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) =>
            <motion.div key={t.name} variants={fadeUp} className="rounded-2xl border bg-card p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">{t.avatar}</div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.school}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-background">
        <div className="container max-w-3xl">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center font-display text-3xl font-bold md:text-4xl mb-12">
            Perguntas frequentes
          </motion.h2>
          <div className="space-y-3">
            {faqs.map((faq, i) =>
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-xl border bg-card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between p-5 text-left font-medium hover:bg-secondary/50 transition-colors">
                  {faq.q}
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-sm text-muted-foreground">{faq.a}</div>}
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
              <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Contato</a>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 GoPedagoX. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>);

}