

## Atualização dos Placeholders na Fábrica de Jogos

### **Problema Identificado**
Os campos "Tema" e "Palavras-chave" na Fábrica de Jogos (`src/pages/GameFactory.tsx`) possuem placeholders que demonstram apenas exemplos de tecnologia ("Hardware", "Sistema Solar", "CPU, RAM, SSD, PLACA"). 

### **Análise Atual**
- **Linha 537**: Campo "Tema" com placeholder `"Ex: Hardware, Sistema Solar..."`
- **Linha 544**: Campo "Palavras-chave" com placeholder `"CPU, RAM, SSD, PLACA"`

### **Solução Proposta**

**1. Campo "Tema" (linha 537)**
Substituir placeholder atual por:
```tsx
placeholder="Ex: Adjetivos, Frações, Sistema Solar..."
```

**2. Campo "Palavras-chave" (linha 544)**  
Substituir placeholder atual por:
```tsx
placeholder="SUJEITO, VERBO, PREDICADO ou FRAÇÃO, NUMERADOR, DENOMINADOR"
```

**3. Textos de Ajuda Adicionais**
Adicionar linha de exemplo abaixo de cada campo com texto auxiliar pequeno mostrando exemplos disciplinares:

```tsx
// Abaixo do campo Tema
<p className="text-[9px] text-muted-foreground">
  Português: <span className="font-medium">Substantivos, Verbos, Pontuação</span> · 
  Matemática: <span className="font-medium">Frações, Geometria, Álgebra</span>
</p>

// Abaixo do campo Palavras-chave  
<p className="text-[9px] text-muted-foreground">
  Ex: SUBSTANTIVO, ADJETIVO, VERBO ou SOMA, SUBTRAÇÃO, MULTIPLICAÇÃO
</p>
```

### **Estrutura de Implementação**
- **Arquivo**: `src/pages/GameFactory.tsx`
- **Linhas alvo**: 537 e 544
- **Abordagem**: Substituição direta dos placeholders + adição de textos auxiliares
- **Compatibilidade**: Mantém toda funcionalidade existente

### **Resultado Esperado**
Interface mais pedagógica e intuitiva para professores de diferentes disciplinas, especialmente Português e Matemática, facilitando o entendimento de como preencher os campos para gerar jogos educativos eficazes.

