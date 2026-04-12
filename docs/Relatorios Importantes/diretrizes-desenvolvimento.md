# 📜 Diretrizes de Desenvolvimento — ZapScore

Este documento estabelece os padrões técnicos e estéticos para a evolução da plataforma ZapScore.

## 1. Experiência do Usuário & Estética (Premium)
- **Visual WOW:** Todas as interfaces devem causar uma primeira impressão impactante.
- **Glassmorphism:** Uso de fundos translúcidos com desfoque (`backdrop-filter: blur()`) para profundidade.
- **Micro-animações:** Transições suaves, indicadores pulsantes para estados ao vivo e efeitos de hover interativos.
- **Tipografia:** Uso mandatório da fonte *Outfit* (Google Fonts) para legibilidade e modernidade.
- **Paleta de COres:** 
  - Fundo: `#020205` (Deep Black)
  - Destaque: `#ff1f1f` (Vibrant Red)
  - Sucesso: `#00ff88` (Spring Green)

## 2. Eficiência de Backend (API)
- **Políticas de Sync:**
  - Jogos ao Vivo: Sincronização agressiva via `/sync/live` (apenas matches ativos).
  - Bootstrap: Apenas para configuração inicial ou correção de inconsistências.
  - Cache: Uso obrigatório do Redis para endpoints de leitura frequente (`fixtures`, `standings`).
- **Segurança:** Chaves de API externas devem permanecer estritamente no ambiente do backend.

## 3. SEO e Acessibilidade
- **H1 Único:** Cada página deve possuir apenas um elemento `<h1>`.
- **Meta-tags:** Todas as rotas Next.js devem definir `metadata` descritivos.
- **Tags Semânticas:** Uso de `<header>`, `<main>`, `<footer>`, `<section>` e `<article>`.

## 4. Banco de Dados (Prisma)
- **Modelagem Relacional:** Manter integridade entre `League`, `Team`, `Fixture` e `Standing`.
- **Dados Técnicos:** Eventos, estatísticas e escalações devem ser persistidos para consultas velozes no frontend.
