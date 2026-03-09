

# Resumo do Site — GoPedagoX

**GoPedagoX** é uma plataforma SaaS voltada para professores, com o objetivo de automatizar e facilitar o planejamento pedagógico usando inteligência artificial.

## Módulos Disponíveis

| Módulo | Descrição |
|---|---|
| **Dashboard** | Painel inicial com visão geral e acesso rápido às ferramentas |
| **Biblioteca** | Acervo de materiais salvos pelo professor |
| **Planejador BNCC** | Geração de planos de aula alinhados à Base Nacional Comum Curricular |
| **Atividades A4** | Criação de atividades impressas (questões abertas, múltipla escolha, estilo ENEM, imagens) |
| **Gerador de Slides** | Apresentações pedagógicas com templates temáticos e geração de imagens por IA |
| **Fábrica de Jogos** | Jogos educativos: caça-palavras, cruzadinha, criptograma, sudoku, anagrama, labirinto, etc. |
| **Gerador de Diagramas** | Diagramas Mermaid (fluxogramas, mapas mentais, sequências) com exportação A4 |
| **Provas e Correção** | Criação de provas com gabarito e correção automática via OMR (leitura óptica de folhas de resposta) |
| **Bloco de Notas** | Anotações rápidas do professor |
| **Suporte** | Canal de contato e ajuda |
| **Planos** | Assinatura e gestão de créditos (Starter, Pro, Master, Ultra) |
| **Timbres e Branding** | Personalização de cabeçalhos com logo e dados da escola |
| **Configurações** | Ajustes gerais da conta |

## Infraestrutura Técnica

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (banco de dados, autenticação, storage, edge functions)
- **IA**: Modelos Gemini e GPT via Lovable AI Gateway (geração de conteúdo, diagramas, slides, jogos, correção de provas, imagens)
- **Exportações**: PDF, DOCX, PPTX via html2pdf.js, docx e pptxgenjs
- **Autenticação**: Email/senha com verificação de email
- **Pagamento**: Integração Stripe para assinaturas e portal do cliente

## Páginas Públicas

- **Landing** (`/`): Página de apresentação do produto
- **Login / Registro / Esqueci Senha**: Fluxo completo de autenticação
- **Termos de Uso** e **Política de Privacidade**
- **Admin Dashboard** e **Suporte Admin**: Painéis administrativos

## Correções Recentes

1. Autenticação nas Edge Functions (check-subscription, process-omr)
2. Fluxo obrigatório de gabarito antes da correção de provas
3. Exportação de diagramas com escala correta para A4
4. Confiabilidade na geração de sintaxe Mermaid

