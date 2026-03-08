

# Relatório Funcional — Pedagox

## Visão Geral

Pedagox é uma plataforma SaaS para automação pedagógica, construída em React 18 + TypeScript + Tailwind CSS, com backend Lovable Cloud (autenticação, banco de dados, storage e edge functions). A IA generativa utiliza o modelo Gemini para geração de conteúdo.

---

## Módulos Funcionais

### 1. Landing Page & Autenticação
- Página institucional com apresentação do produto
- Cadastro e login com verificação de email
- Sessão protegida com redirecionamento automático

### 2. Dashboard
- Painel inicial do professor após login
- Acesso rápido a todos os módulos

### 3. Planejador BNCC
- Geração de planos de aula alinhados à BNCC via IA
- 3 modelos: Simples, Tradicional e Criativo (PBL)
- Seleção de nível (Fund. Iniciais/Finais, Ensino Médio), série e disciplina
- Suporte a múltiplas aulas (cronograma aula a aula)
- Refinamento iterativo ("Pedir Ajuste ao Plano")
- Exportação PDF e DOCX com timbre escolar

### 4. Atividades A4
- Editor de blocos WYSIWYG para atividades impressas
- Modo ENEM para questões no padrão vestibular
- Geração de imagens contextuais via IA
- Exportação A4 com cabeçalho escolar

### 5. Gerador de Slides
- Geração de apresentações via IA por tema
- **Status atual: em desenvolvimento** (banner amarelo recomendando edição no PowerPoint/Google Slides)
- Exportação PPTX

### 6. Fábrica de Jogos Pedagógicos
5 tipos de jogos otimizados para impressão A4:

| Jogo | Destaques |
|------|-----------|
| **Caça-Palavras** | Grades 8×8 a 20×20, minitexto pedagógico com palavras em CAIXA ALTA, múltiplas direções |
| **Palavras Cruzadas** | 5 tipos de dica (texto, sinônimo, lacuna, pergunta, enigma), simetria configurável |
| **Criptograma** | 5 cifras (numérica, substituição, César, matemática, Vigenère), 5 temas de símbolos |
| **Sudoku** | 4×4 a 9×9, conteúdo temático (números, letras, formas, emojis, palavras) |
| **Labirinto** | Checkpoints opcionais com perguntas, dificuldade progressiva (até 41×41) |

**Recursos transversais dos jogos:**
- Etapa escolar (Anos Iniciais/Finais/Ensino Médio) com presets automáticos
- Modo Rápido vs Avançado
- Modos de cor: Colorido, P&B, Alto Contraste
- Timbre escolar automático (via módulo Branding)
- Gabarito/folha de respostas para o professor
- Exportação PDF com layout A4 fixo (tabelas HTML para fidelidade)

### 7. Provas e Correção
- Criação de provas manual ou via IA
- Embaralhamento de questões e alternativas (Fisher-Yates) com mapa de respostas por UUID
- Geração de QR Code por versão (A, B, C)
- Folha de respostas OMR padronizada
- **Correção automatizada:**
  - Upload de fotos de gabaritos (drag-and-drop, múltiplas imagens)
  - Processamento via edge function (Gemini Flash): leitura de QR, detecção de respostas
  - Tela de validação assistida (correção manual de itens duvidosos)
  - Salvamento da imagem original como evidência de auditoria
- Exportação DOCX

### 8. Timbres e Branding
- Upload de logotipo da escola (Storage com RLS)
- Nome da escola editável
- Dados compartilhados automaticamente com todos os módulos via hook `useTimbre`

### 9. Configurações
- Página de configurações do usuário (perfil)

---

## Infraestrutura Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Estado | React Query, React Hooks |
| Backend | Lovable Cloud (Supabase) |
| IA | Gemini 3 Flash (edge functions) |
| Exportação | html2pdf.js (PDF), docx (Word), pptxgenjs (PPTX) |
| Segurança | RLS em todas as tabelas, autenticação obrigatória |

