

## Resumo do Site — GoPedagoX

**GoPedagoX** é uma plataforma SaaS voltada para professores, que utiliza inteligência artificial para automatizar o planejamento pedagógico. O sistema é construído em React + TypeScript com Tailwind CSS e backend via Lovable Cloud.

### Funcionalidades Principais

1. **Planejador BNCC** (`/app/bncc`) — Gera planos de aula alinhados à BNCC com IA. Suporta 3 modelos (Simples, Tradicional, Criativo/PBL), múltiplas séries e disciplinas, com opção de refinamento.

2. **Gerador de Atividades** (`/app/atividades`) — Cria atividades pedagógicas em formato A4 com editor de blocos.

3. **Gerador de Slides** (`/app/slides`) — Produz apresentações educativas com IA.

4. **Fábrica de Jogos** (`/app/jogos`) — Gera jogos educativos variados: caça-palavras, palavras cruzadas, sudoku, anagramas, labirinto, criptograma, entre outros (17+ tipos).

5. **Provas e Correção OMR** (`/app/provas`) — Cria provas com questões abertas e múltipla escolha via IA. Inclui scanner OMR para correção automática de gabaritos.

6. **Bloco de Notas** (`/app/notas`) — Anotações rápidas para o professor.

7. **Timbres/Branding** (`/app/timbres`) — Personalização de cabeçalhos para documentos.

8. **Suporte** (`/app/suporte`) — Sistema de tickets de suporte.

### Estrutura Técnica

- **Autenticação**: Login/registro com email via Lovable Cloud
- **Monetização**: Sistema de créditos + planos de assinatura (Starter, Pro, Master, Ultra) com integração de pagamento
- **Backend Functions**: 7 edge functions (generate-plano, generate-atividade, generate-slides, generate-game, generate-prova, generate-image, process-omr)
- **IA**: Usa modelos Lovable AI (Gemini) para geração de conteúdo
- **Admin**: Dashboard administrativo e painel de suporte

### Páginas Públicas

- Landing page (`/`)
- Login / Registro
- Termos de uso e Política de privacidade
- Página de preços

