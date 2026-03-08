import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-3xl">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Início
          </Button>
        </Link>

        <h1 className="font-display text-3xl font-bold mb-8">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: 08 de março de 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-muted-foreground">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">1. Coleta de Dados</h2>
            <p>O GoPedagoX coleta os seguintes dados pessoais:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Nome completo:</strong> para personalização da conta e dos materiais gerados.</li>
              <li><strong>Endereço de e-mail:</strong> para autenticação, comunicação e recuperação de senha.</li>
              <li><strong>Nome da escola (opcional):</strong> para personalização do timbre escolar nos documentos gerados.</li>
              <li><strong>Logotipo da escola (opcional):</strong> armazenado de forma segura para uso exclusivo nos materiais do professor.</li>
              <li><strong>Dados de pagamento:</strong> processados exclusivamente por processadores de pagamento seguros (Stripe). O GoPedagoX não armazena dados de cartão de crédito.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">2. Uso dos Dados</h2>
            <p>Os dados coletados são utilizados exclusivamente para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Prestação e manutenção do serviço contratado.</li>
              <li>Personalização da experiência do usuário.</li>
              <li>Geração de conteúdos pedagógicos por inteligência artificial.</li>
              <li>Melhoria contínua dos modelos de IA e da qualidade dos materiais gerados.</li>
              <li>Comunicação sobre atualizações, novos recursos e informações relevantes ao serviço.</li>
            </ul>
            <p>Os dados <strong>não são vendidos, compartilhados ou cedidos</strong> a terceiros para fins de marketing ou publicidade.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">3. Segurança dos Dados</h2>
            <p>O GoPedagoX adota medidas técnicas rigorosas para proteger os dados dos usuários:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Isolamento de dados:</strong> Políticas de segurança em nível de linha (Row-Level Security) garantem que cada professor acesse somente seus próprios documentos, provas, timbres e materiais.</li>
              <li><strong>Criptografia:</strong> Todas as comunicações são protegidas por HTTPS/TLS.</li>
              <li><strong>Autenticação segura:</strong> Senhas são armazenadas com hash e nunca em texto plano.</li>
              <li><strong>Armazenamento seguro:</strong> Logotipos e gabaritos são armazenados em buckets com políticas de acesso restritas.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">4. Conformidade com a LGPD</h2>
            <p>O GoPedagoX está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Como titular de dados pessoais, você tem os seguintes direitos:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Acesso:</strong> solicitar informações sobre seus dados pessoais armazenados.</li>
              <li><strong>Correção:</strong> solicitar a correção de dados incompletos, inexatos ou desatualizados.</li>
              <li><strong>Exclusão:</strong> solicitar a eliminação de seus dados pessoais.</li>
              <li><strong>Portabilidade:</strong> solicitar a transferência de seus dados a outro prestador de serviço.</li>
              <li><strong>Revogação do consentimento:</strong> revogar a qualquer momento o consentimento para o tratamento de dados.</li>
            </ul>
            <p>Para exercer qualquer um destes direitos, entre em contato pelo e-mail: <strong>contato@gopedagox.com</strong>.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">5. Retenção de Dados</h2>
            <p>Os dados pessoais são mantidos enquanto a conta do usuário estiver ativa. Após a exclusão da conta, os dados são removidos permanentemente em até 30 dias, exceto quando a retenção for necessária para cumprimento de obrigações legais.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">6. Alterações nesta Política</h2>
            <p>Esta Política de Privacidade pode ser atualizada periodicamente. Notificaremos os usuários sobre alterações significativas por e-mail ou aviso na plataforma. A data da última atualização será sempre indicada no topo deste documento.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
