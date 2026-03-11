

# Análise: Os recursos dos planos estão sendo aplicados corretamente?

## Problemas Encontrados

### 1. **CRÍTICO: `check-subscription` reseta créditos a cada login**
A função `check-subscription` é chamada toda vez que o `useCredits` carrega (a cada login/refresh). Ela **sempre sobrescreve** `credits_general` e `credits_exams` com o valor máximo do plano:

```text
credits_general: planInfo.credits_general,  // sempre 30, 60, etc.
credits_exams: planInfo.credits_exams,      // sempre 50, 100, etc.
```

Isso significa que se um usuário Pro gastou 20 dos 30 créditos de criação, ao recarregar a página os créditos voltam para 30. **Os créditos nunca são realmente consumidos de forma persistente.**

### 2. **Correção OMR não verifica/deduz créditos de correção**
Os componentes `OMRScanner.tsx` e `CameraScanner.tsx` chamam `process-omr` diretamente **sem verificar** `canCorrectExam()` nem chamar `deductExamCredits()`. Qualquer usuário, mesmo Starter, pode corrigir folhas ilimitadamente.

### 3. **Usuário sem assinatura ativa não é rebaixado**
Quando `check-subscription` detecta que não há assinatura ativa no Stripe, retorna `{ subscribed: false, plan_type: "starter" }` mas **não atualiza o perfil no banco**. Se um usuário cancelar o plano Pro, ele continua com `plan_type: "pro"` no banco até que algo mude.

### 4. **Branding verifica limite mas não usa `canUploadLogo()`**
A página Branding implementa sua própria lógica (`timbres.length < maxTimbres`) ao invés de usar `canUploadLogo()` do hook. Funciona, mas é duplicação de lógica.

---

## Plano de Correção

### A. Corrigir `check-subscription` — Não resetar créditos em toda chamada

Mudar a lógica para:
- **Se o plano mudou** (upgrade/downgrade): atualizar créditos para o novo limite
- **Se o plano é o mesmo**: não tocar nos créditos (preservar o consumo)
- **Se não há assinatura ativa**: rebaixar para `starter` no banco com créditos padrão (10/10)

```text
Fluxo corrigido:
1. Ler perfil atual do banco (plan_type atual)
2. Se plan_type mudou → update com novos limites
3. Se plan_type é o mesmo → update apenas subscription_status e stripe_customer_id
4. Se sem assinatura → rebaixar para starter no banco
```

### B. Adicionar verificação de créditos na correção OMR

Em `OMRScanner.tsx` e `CameraScanner.tsx`:
- Antes de processar, verificar `canCorrectExam(sheets.length)` 
- Após cada folha processada com sucesso, chamar `deductExamCredits(1)`
- Mostrar toast de erro se sem créditos

### C. Rebaixar perfil quando sem assinatura

No bloco onde `check-subscription` retorna `subscribed: false`, adicionar update no banco:
```sql
UPDATE profiles SET plan_type='starter', credits_general=10, credits_exams=10, 
logos_limit=0, subscription_status='inactive' WHERE user_id=...
```

---

## Arquivos a Modificar

1. **`supabase/functions/check-subscription/index.ts`** — Ler plano atual antes de atualizar; só resetar créditos em mudança de plano; rebaixar quando sem assinatura
2. **`src/components/exams/OMRScanner.tsx`** — Adicionar `useCredits()`, verificar `canCorrectExam` antes de processar, deduzir créditos após sucesso
3. **`src/components/exams/CameraScanner.tsx`** — Mesmo tratamento do OMRScanner

