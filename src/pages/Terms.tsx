import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-3xl">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Início
          </Button>
        </Link>

        <h1 className="font-display text-3xl font-bold mb-8">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: 08 de março de 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-muted-foreground">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">1. Objeto</h2>
            <p>O GoPedagoX é uma plataforma SaaS (Software as a Service) de auxílio pedagógico que oferece ferramentas de geração automatizada de planos de aula alinhados à BNCC, atividades impressas, jogos pedagógicos, apresentações de slides, sequências didáticas e provas com correção automatizada por leitura OMR. A plataforma destina-se exclusivamente a profissionais da educação.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">2. Uso da Inteligência Artificial</h2>
            <p>O GoPedagoX utiliza modelos avançados de inteligência artificial para geração de conteúdos pedagógicos. Os modelos podem ser atualizados periodicamente para garantir a melhor qualidade possível. Os materiais gerados são sugestões automatizadas e <strong>devem ser revisados pelo professor antes da aplicação em sala de aula</strong>.</p>
            <p className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-foreground font-medium">
              ⚠️ Segurança Pedagógica: O GoPedagoX é uma ferramenta de apoio. A responsabilidade final sobre o conteúdo ensinado e as questões aplicadas em provas é exclusiva do docente usuário. O GoPedagoX não se responsabiliza por imprecisões pedagógicas geradas pela IA.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">3. Planos e Créditos</h2>
            <p>A plataforma opera sob um modelo freemium com quatro níveis de assinatura:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Starter (Gratuito):</strong> 5 créditos únicos (não renováveis), acesso a todos os módulos, exportações com marca d'água.</li>
              <li><strong>Pro (R$ 24,90/mês):</strong> 15 créditos renováveis mensalmente, 1 timbre escolar, sem marca d'água.</li>
              <li><strong>Master (R$ 44,90/mês):</strong> 50 créditos renováveis mensalmente, até 3 timbres escolares, suporte prioritário.</li>
              <li><strong>Ultra (R$ 89,90/mês):</strong> Créditos ilimitados, timbres ilimitados, suporte prioritário máximo via ticket.</li>
            </ul>
            <p>Cada ação de geração por IA (plano de aula, jogo, slides, correção de prova) consome 1 crédito. Os créditos dos planos pagos são renovados a cada ciclo mensal de faturamento.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">4. Propriedade Intelectual</h2>
            <p>Os materiais gerados pela plataforma (PDFs, documentos DOCX, apresentações PPTX) pertencem ao professor usuário, que pode utilizá-los livremente em sua prática docente. O código-fonte, design, marca, logotipos e a tecnologia da plataforma GoPedagoX são propriedade exclusiva da empresa e protegidos por direitos autorais.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">5. Cancelamento</h2>
            <p>As assinaturas dos planos Pro, Master e Ultra podem ser canceladas a qualquer momento pelo usuário, sem multa ou fidelidade contratual. O acesso aos recursos do plano contratado será mantido até o término do ciclo de faturamento vigente. Após o cancelamento, a conta será revertida para o plano Starter.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">6. Disposições Gerais</h2>
            <p>O GoPedagoX reserva-se o direito de atualizar estes Termos de Uso a qualquer momento, mediante notificação ao usuário por e-mail ou aviso na plataforma. O uso continuado da plataforma após a modificação constitui aceitação dos novos termos.</p>
            <p>Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de domicílio do usuário para dirimir eventuais controvérsias.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
