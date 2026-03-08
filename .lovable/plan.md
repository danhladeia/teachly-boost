

## Por que o site não aparece no Google?

O SEO técnico (meta tags, sitemap, robots.txt, JSON-LD) já está configurado corretamente. O problema é que **o Google ainda não indexou o site**. Isso acontece por alguns motivos:

### 1. O site precisa ser submetido ao Google Search Console
O Google não descobre sites automaticamente de forma rápida. Você precisa:
- Acessar [Google Search Console](https://search.google.com/search-console)
- Adicionar a propriedade `https://gopedagox.lovable.app`
- Verificar a propriedade (via meta tag HTML ou DNS)
- Submeter o sitemap: `https://gopedagox.lovable.app/sitemap.xml`

### 2. SPA (Single Page Application) e renderização
O site é uma SPA em React. O Google consegue renderizar JavaScript, mas pode demorar mais. As meta tags estão no `index.html` estático, o que é bom. Porém, as páginas internas (Landing, Termos, etc.) são renderizadas via JavaScript — o Google pode não indexar todo o conteúdo imediatamente.

### 3. O que posso fazer no código

Não há alterações de código necessárias — a configuração SEO está completa. O próximo passo é **manual**:

1. Acesse o [Google Search Console](https://search.google.com/search-console)
2. Clique em "Adicionar propriedade" → escolha "Prefixo do URL" → digite `https://gopedagox.lovable.app`
3. Verifique via **tag HTML** (adicionar uma meta tag que eu posso inserir no `index.html` para você)
4. Após verificação, vá em "Sitemaps" → envie `https://gopedagox.lovable.app/sitemap.xml`
5. Use "Inspeção de URL" para solicitar indexação da página principal

A indexação pode levar de **alguns dias a algumas semanas** após a submissão.

### Se quiser, posso ajudar com:
- Adicionar a meta tag de verificação do Google Search Console no `index.html` (você me passa o código de verificação)
- Configurar um domínio personalizado (melhora SEO a longo prazo)

