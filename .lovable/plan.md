

# Plano: Backend + Criação de Provas com Embaralhamento

## Resumo
Criar as tabelas dedicadas no banco de dados para provas, questões, respostas de alunos e gabaritos físicos. Implementar embaralhamento de versões (A/B/C) com QR Code contendo UUID do banco. Corrigir bugs existentes (modelo de imagem IA incorreto, CORS incompleto).

---

## 1. Migrações de Banco de Dados

### Novas tabelas:

**`provas`** - Tabela principal de provas
- `id` (uuid, PK), `user_id` (uuid, NOT NULL), `titulo` (text), `temas` (text), `nivel` (text), `serie` (text), `tipo_questoes` (text), `escola` (text), `professor` (text), `turma` (text), `config_tempo` (integer, nullable), `tipo_tempo` (text, default 'total'), `status` (text, default 'rascunho'), `created_at`, `updated_at`
- RLS: usuário só acessa suas próprias provas

**`questoes`** - Questões vinculadas a uma prova
- `id` (uuid, PK), `prova_id` (uuid, FK -> provas), `ordem` (integer), `tipo` (text: 'mc' ou 'open'), `conteudo` (text), `alternativas` (jsonb, nullable), `resposta_correta` (integer, nullable), `linhas` (integer, default 4), `imagem_url` (text, nullable)
- RLS: via join com provas.user_id

**`versoes_prova`** - Versões embaralhadas (A, B, C...)
- `id` (uuid, PK), `prova_id` (uuid, FK -> provas), `versao_label` (text: 'A', 'B', 'C'), `mapa_questoes` (jsonb - array com ordem das questões e mapa de alternativas), `qr_code_id` (uuid, unique), `created_at`
- RLS: via join com provas.user_id

**`respostas_alunos`** - Para uso futuro (prova online)
- `id` (uuid, PK), `prova_id` (uuid, FK), `versao_id` (uuid, FK, nullable), `nome_aluno` (text), `nota` (numeric, nullable), `respostas_json` (jsonb), `tempo_gasto` (integer, nullable), `created_at`
- RLS: via join com provas.user_id

### Funções auxiliares de RLS:
- `is_prova_owner(prova_id uuid)` - SECURITY DEFINER para verificar se o user logado é dono da prova

---

## 2. Correções de Bugs Críticos

### 2.1 Modelo de imagem incorreto
`generate-image/index.ts` usa `google/gemini-2.5-flash-image` que não é o modelo correto para geração de imagens. Corrigir para `google/gemini-3-pro-image-preview`.

### 2.2 CORS incompleto
`generate-prova/index.ts` usa headers CORS sem os headers de plataforma do Supabase SDK. Atualizar para incluir `x-supabase-client-platform`, etc.

### 2.3 config.toml
Adicionar configuração `verify_jwt = false` para todas as edge functions.

---

## 3. Embaralhamento de Versões (A/B/C)

### Lógica no frontend (`Exams.tsx`):
- Botão "Embaralhar → Gerar Versão" que:
  1. Permuta a ordem das questões MC aleatoriamente
  2. Permuta a ordem das alternativas dentro de cada questão MC
  3. Gera um `mapa_questoes` JSON descrevendo a nova ordem
  4. Salva na tabela `versoes_prova` com label incremental (A, B, C...)
  5. Gera QR Code com o UUID da versão (não mais com o gabarito inteiro)

### QR Code com UUID:
- O QR Code no gabarito OMR passará a conter `{ versao_id: "uuid" }` em vez do gabarito completo
- O scanner buscará o gabarito no banco usando esse UUID

---

## 4. Refatoração do Exams.tsx

### Salvar prova no banco:
- Ao clicar "Salvar", criar registro em `provas` + registros em `questoes` (em vez de salvar tudo como JSON em `documentos_salvos`)
- Manter compatibilidade com `documentos_salvos` para provas antigas

### Fluxo de embaralhamento:
1. Professor cria/gera questões
2. Salva a prova (tabela `provas` + `questoes`)
3. Clica "Embaralhar" → gera versão na tabela `versoes_prova`
4. Preview A4 mostra a versão selecionada
5. Cada versão tem seu próprio gabarito OMR com QR Code apontando para `versao_id`

### Scanner atualizado:
- Ao ler QR Code com `versao_id`, buscar no banco o mapa de respostas corretas
- Calcular nota baseada no mapa de embaralhamento

---

## 5. Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `supabase/config.toml` | Adicionar config de edge functions |
| `supabase/functions/generate-image/index.ts` | Corrigir modelo IA |
| `supabase/functions/generate-prova/index.ts` | Corrigir CORS |
| Nova migração SQL | Criar 4 tabelas + RLS + função auxiliar |
| `src/pages/Exams.tsx` | Refatorar salvar/carregar + embaralhamento + preview versões |
| `src/components/exams/OMRAnswerSheet.tsx` | QR Code com UUID em vez de gabarito inline |
| `src/components/exams/OMRScanner.tsx` | Buscar gabarito do banco via UUID |

---

## Detalhes Técnicos

- As versões embaralhadas usam o algoritmo Fisher-Yates para permutação
- O `mapa_questoes` armazena: `[{ questao_id, ordem_original, nova_ordem, mapa_alternativas: [2,0,3,1] }]`
- O QR Code é reduzido a apenas `{ v: "uuid" }` para caber em QR compactos
- RLS usa SECURITY DEFINER functions para evitar recursão nas políticas de tabelas com FK

