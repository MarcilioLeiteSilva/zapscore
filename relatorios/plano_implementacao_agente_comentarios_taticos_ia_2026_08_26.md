# 🎙️ Plano de Implementação — Agente de Comentários Táticos ao Vivo & Coleta Multi-Fontes (Crawl4AI + LLM Engine)

> **Data de Criação:** 26/08/2026  
> **Status:** `[A FAZER - PLANEJADO 🚀]`  
> **Módulos Envolvidos:** `apps/api` (Worker Crawl4AI + NestJS Hub), `relatorios/ECOSYSTEM.md`, `apps/web` (AdminPanel Monitor), `apps/mobile` / `apps/estaduais/*` / `apps/europa/*` (Flutter Live Timeline).

---

## 🎯 1. Visão Geral e Proposta de Valor

O **Agente de Comentários Táticos ao Vivo** é um motor de inteligência esportiva autônomo projetado para transformar o acompanhamento de jogos no ZapScore em uma experiência imersiva de **transmissão escrita interativa com análises táticas em tempo real**.

### 🌟 Diferencial Competitivo:
* **Não é apenas narração de lances ("X chutou a gol"):** É um **comentarista tático inteligente** que analisa esquemas táticos, pressão alta, desvios defensivos, mapa de calor estatístico e impacto das alterações de técnicos.
* **Cadência Contínua de 5 em 5 Minutos:** Gera entre 20 a 25 análises distribuídas em 6 fases cronológicas por jogo.
* **Validação Cruzada Tripla (Crawl4AI + API-Football):** Coleta em tempo real de 3 portais esportivos consagrados (ex: *GE*, *Flashscore*, *UOL Esporte*), eliminando alucinações ao cruzar fatos com as estatísticas oficiais da partida.

---

## ⏱️ 2. Ciclo de Vida e Cadência dos Comentários

O agente opera em 6 fases bem definidas para cada partida monitorada:

```mermaid
flowchart LR
    A[1. Pré-Jogo<br>-30 min] --> B[2. 1º Tempo<br>A cada 5 min]
    B --> C[3. Intervalo<br>HT - Raio-X]
    C --> D[4. 2º Tempo<br>A cada 5 min]
    D --> E[5. Apito Final<br>FT - Veredito]
    E --> F[6. Resenha Final<br>MVP & Notas]
```

| Fase | Minuto / Trigger | Conteúdo Gerado |
| :--- | :--- | :--- |
| **1. 📋 Pré-Jogo** | 30 a 15 min antes do início | Análise das escalações confirmadas, esquemas táticos (ex: 4-3-3 vs 3-5-2), desfalques e proposta inicial de jogo. |
| **2. ⚽ 1º Tempo** | **A cada 5 minutos**<br>*(5', 10', 15', 20', 25', 30', 35', 40', 45')* | Leitura do ritmo, intensidade das equipes, setores de pressão, chances perigosas e postura defensiva. |
| **3. ⏸️ Intervalo** | Status `HT` (Intervalo) | Raio-X estatístico consolidado (posse de bola, finalizações certas, desarmes) e diagnóstico do que precisa mudar. |
| **4. 🔥 2º Tempo** | **A cada 5 minutos**<br>*(50', 55', 60', 65', 70', 75', 80', 85', 90'+)* | Análise do impacto das substituições, cansaço físico, transições rápidas e desfecho dramático nos acréscimos. |
| **5. 🏁 Apito Final** | Status `FT` (Fim de Jogo) | Veredito instantâneo do confronto e mérito do placar. |
| **6. 🏆 Resenha Final** | Pós-Jogo (+5 min pós FT) | Crônica esportiva completa, eleição dos **Melhores em Campo (MVP)**, notas dos técnicos e impacto na tabela. |

---

## 🏗️ 3. Arquitetura Técnica em 4 Camadas

```mermaid
flowchart TD
    subgraph CAMADA_1 [1. Coleta Multi-Fontes em Tempo Real]
        C1[GE Tempo Real]
        C2[Flashscore / Sofascore]
        C3[UOL Esporte]
        WORKER[🤖 Microserviço Crawl4AI / Scraper Assíncrono Python ou Node]
        C1 --> WORKER
        C2 --> WORKER
        C3 --> WORKER
    end

    subgraph CAMADA_2 [2. Hub de Validação & Fusão de Dados - apps/api]
        API_DATA[Dados Oficiais ZapScore API:<br>Posse, Chutes, Cartões, Escalações]
        VALIDATOR[Validador & Sanitizador de Contexto]
        WORKER --> VALIDATOR
        API_DATA --> VALIDATOR
    end

    subgraph CAMADA_3 [3. Motor de Inteligência Artificial LLM]
        LLM[LLM Engine: Gemini 1.5 Flash / DeepSeek V3]
        VALIDATOR -->|Prompt Estruturado a cada 5 min| LLM
        INSIGHT[Geração do Insight JSON]
        LLM --> INSIGHT
    end

    subgraph CAMADA_4 [4. Distribuição em Tempo Real]
        DB[(PostgreSQL Prisma:<br>Tabela FixtureInsight)]
        WS[Socket.io FixturesGateway]
        INSIGHT --> DB
        DB --> WS
        WS --> FLUTTER[📱 Apps Flutter: Timeline Dinâmica]
        WS --> ADMIN[🖥️ AdminPanel: Live Monitor]
    end
```

---

## 🗄️ 4. Modelo de Dados Prisma (`apps/api/prisma/schema.prisma`)

```prisma
model FixtureInsight {
  id          String   @id @default(uuid())
  fixtureId   Int      // ID numérico da partida
  minute      Int      // Minuto do jogo (ex: 5, 10, 45, 90)
  phase       String   // "PRE_MATCH", "1H", "HT", "2H", "FT", "POST_MATCH"
  title       String   // Título curto (ex: "Pressão sufocante do Grêmio pelo lado direito")
  comment     String   // Texto analítico rico de 2 a 3 frases
  sentiment   String   // "NEUTRAL", "INTENSE", "HOME_DOMINANCE", "AWAY_DOMINANCE", "GOAL", "RED_CARD"
  statsSnapshot Json?  // Snapshot das estatísticas naquele minuto { homePossession: 62, shots: 4, ... }
  mvpPlayers  Json?    // Array com os melhores em campo (na fase POST_MATCH)
  createdAt   DateTime @default(now())

  @@index([fixtureId, minute])
  @@index([fixtureId, phase])
}
```

---

## 📱 5. Experiência do Usuário no Flutter (`apps/estaduais/*`, `apps/europa/*`, `apps/mobile`)

### Nova Aba na Tela de Detalhes do Jogo (`FixtureDetailScreen`):
* **Aba "Comentários & IA"**:
  * Timeline vertical moderna e fluida com cards enriquecidos.
  * Ícones visuais dinâmicos por tipo de lance/fase (📋 Pré-Jogo, 🔥 Pressão, ⚽ Gol/Análise, ⏸️ Intervalo, 🏆 Resenha).
  * Conexão via **WebSocket (Socket.io)** para receber novos insights da IA instantaneamente sem necessidade de recarregar a tela.
  * Indicador de digitação/análise (*"IA analisando os últimos 5 minutos..."*).

---

## 📋 6. Roteiro de Implementação em 5 Fases

### Fase 1: Microserviço de Coleta (Crawl4AI / Scraper)
- [ ] Configurar container leve com Crawl4AI / Scraper headless com suporte a extração rápida de minutos e eventos.
- [ ] Criar adaptadores para as 3 fontes primárias (GE, Flashscore, UOL).

### Fase 2: Modelo de Dados e Endpoint na ZapScore API
- [ ] Adicionar model `FixtureInsight` no schema Prisma da `apps/api` e rodar migration.
- [ ] Criar `FixtureInsightsService` e rotas `GET /fixtures/:id/insights`.
- [ ] Integrar broadcast no `FixturesGateway` (WebSocket `fixture-insight-new`).

### Fase 3: Orquestrador da LLM e Prompts Táticos
- [ ] Implementar serviço de geração em lote com Gemini 1.5 Flash / DeepSeek com formatação estrita em JSON.
- [ ] Configurar cron de 5 minutos que varre partidas com status `LIVE` ou `HT`.

### Fase 4: Tela de Monitoramento no AdminPanel
- [ ] Criar `/adminpanel/agents/tactical-insights` com feed ao vivo de insights para conferência do operador.

### Fase 5: Integração nos Clientes Flutter
- [ ] Implementar `InsightsCubit` e widget `TacticalTimelineWidget` nos aplicativos mobile.
- [ ] Validar consumo em dispositivo real com partidas ao vivo.

---

> 📌 **Governança:** Este plano de ação está integrado como tarefa pendente oficial no **Capítulo 15** do [`relatorios/ECOSYSTEM.md`](file:///d:/zapscore/relatorios/ECOSYSTEM.md).
