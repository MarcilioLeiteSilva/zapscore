# Plano de Implementação: Dashboard de Desempenho e Auditoria da IA
**Data de Criação**: 13 de Junho de 2026
**Status**: Planejamento / Proposta

Este plano detalha o roteiro técnico e visual para desenvolver a funcionalidade de auditoria e estatísticas de acertos das análises de Inteligência Artificial no ecossistema ZapScore (Backend NestJS + Mobile Flutter).

---

## 1. Escopo da Funcionalidade

### 1.1. No Backend (API)
* **Resolução Automática**: Analisar e determinar se as previsões da IA foram corretas assim que uma partida for encerrada (`FT`, `AET`, `PEN`).
* **Regras de Validação de Palpites**: Implementar um avaliador que lê as strings contidas nos palpites rápidos (chips) e as valida contra o resultado final da partida.
* **Estatísticas Agregadas**: Disponibilizar um endpoint que calcule a taxa de acerto (%) por campeonato ou por período (últimos X dias).

### 1.2. No Aplicativo (Mobile)
* **Auditoria Pública (Transparência)**:
  * Exibir o selo 🟢 **Palpite Correto** ou 🔴 **Palpite Incorreto** na aba de IA nos detalhes de partidas finalizadas.
  * Adicionar marcadores visuais (✅ ou ❌) nos palpites rápidos individuais da partida.
* **Dashboard de Desempenho (Estatísticas)**:
  * Criar uma nova tela acessível via menu lateral contendo gráficos de precisão da IA, métricas gerais e a lista cronológica de jogos passados com o resultado de cada previsão.

---

## 2. Implementação do Banco de Dados (Prisma)

Modificaremos o modelo `FixtureAiAnalysis` em `prisma/schema.prisma` para incluir os dados de auditoria:

```prisma
// Modelo estendido com os campos de auditoria
model FixtureAiAnalysis {
  id                String   @id @default(uuid())
  fixtureId         String   @unique @map("fixture_id")
  fixture           Fixture  @relation(fields: [fixtureId], references: [id], onDelete: Cascade)
  
  // Dados de entrada
  probHome          Int      @map("prob_home")
  probAway          Int      @map("prob_away")
  probDraw          Int      @map("prob_draw")
  predictionSummary String   @map("prediction_summary") @db.Text
  tips              Json     // Array de strings (ex: ["Ambas marcam", "Mais de 2.5 gols"])
  commentary        String   @db.Text
  lineupsFactored   Boolean  @default(false) @map("lineups_factored")
  
  // --- Novos Campos para Auditoria ---
  predictedResult   String?  @map("predicted_result") // HOME, AWAY, DRAW (calculado pela maior prob)
  isHit             Boolean? @map("is_hit")           // null (pendente), true (acertou), false (errou)
  tipsStatus        Json?    @map("tips_status")      // Array resolvido: [{"tip": "...", "hit": true}]
  
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@map("fixture_ai_analysis")
}
```

---

## 3. Implementação do Backend (NestJS)

### 3.1. Fase Inicial (Salvar Predição no Sync)
Quando a análise da IA é gerada e salva no banco (`ai-sync.service.ts`), o sistema calcula quem é o favorito:
```typescript
let predictedResult = 'DRAW';
if (probHome > probAway && probHome > probDraw) predictedResult = 'HOME';
else if (probAway > probHome && probAway > probDraw) predictedResult = 'AWAY';
```

### 3.2. Fase de Resolução (Pós-Jogo)
Criar uma função helper para interpretar textualmente se os palpites individuais (tips) foram corretos:
```typescript
function evaluateTip(tipText: string, homeGoals: number, awayGoals: number): boolean {
  const normalized = tipText.toLowerCase();
  const totalGoals = homeGoals + awayGoals;

  if (normalized.includes('ambas marcam') || normalized.includes('btts')) {
    return homeGoals > 0 && awayGoals > 0;
  }
  if (normalized.includes('mais de 2.5') || normalized.includes('over 2.5')) {
    return totalGoals > 2;
  }
  if (normalized.includes('mais de 1.5') || normalized.includes('over 1.5')) {
    return totalGoals > 1;
  }
  if (normalized.includes('menos de 2.5') || normalized.includes('under 2.5')) {
    return totalGoals < 3;
  }
  if (normalized.includes('casa vence') || normalized.includes('mandante vence')) {
    return homeGoals > awayGoals;
  }
  if (normalized.includes('fora vence') || normalized.includes('visitante vence')) {
    return awayGoals > homeGoals;
  }
  
  return true; // Fallback neutro
}
```

### 3.3. Endpoint de Estatísticas (`AiAnalysisController`)
Criar o endpoint `/fixtures/ai/performance-statistics` aceitando query params:
* `leagueId` (opcional): Filtro de campeonato.
* `days` (opcional): Período para calcular a taxa de acertos (ex: 7, 30, 90 dias).
* Retorna o JSON contendo:
  ```json
  {
    "totalGames": 45,
    "hits": 36,
    "misses": 9,
    "accuracyPercentage": 80.0,
    "sinceDate": "2026-06-14T00:00:00.000Z",
    "recentAudits": [
      {
        "fixtureId": "...",
        "homeTeam": "Fortaleza",
        "awayTeam": "Ceará",
        "score": "2-1",
        "predicted": "HOME",
        "isHit": true,
        "date": "2026-06-13T22:00:00.000Z"
      }
    ]
  }
  ```

---

## 4. Implementação no Aplicativo (Flutter)

### 4.1. Chamada de Rede e Model
* **`api_client.dart`**: Criar o método `getAiPerformanceStats({int? leagueId, int? days})`.
* **Model `AiPerformanceStats`**: Criar a classe para parsear os dados estatísticos consolidados e os jogos de auditoria.
* **Model `FixtureAiAnalysis`**: Mapear `isHit` e `tipsStatus`.

### 4.2. Detalhes da Partida (Tela de IA)
* Adicionar verificação se `fixture.statusShort` é finalizado (`FT`, `AET`, `PEN`).
* Exibir um card no topo com cor de fundo verde para acerto ou vermelha para erro, contendo o resultado da predição.
* Ao renderizar a lista de Chips, verificar se `tipsStatus` está presente e anexar um ícone de `Icons.check_circle_outline` (verde) ou `Icons.cancel_outlined` (vermelho).

### 4.3. Tela do Dashboard de Desempenho
* **Interface**:
  * **Filtros**: Seletores amigáveis (Dropdowns) para Campeonato e Período de Dias.
  * **Indicador Geral**: Um círculo de progresso animado (`CircularProgressIndicator` customizado com tamanho maior) centralizado exibindo a porcentagem de acertos da IA.
  * **Lista de Jogos**: Um `ListView` estilizado exibindo a lista de auditoria com os escudos dos times, o placar final e o selo de acerto/erro.

---

## 5. Cronograma Recomendado

1. **Dia 1: Banco de Dados e Backend**
   * Migration no Prisma.
   * Criação do resolvedor pós-jogo e testes de regras com script na pasta `scratch`.
   * Criação e validação do endpoint de estatísticas agregadas.
2. **Dia 2: Aplicativo Flutter (Integração)**
   * Integração de rede e mapeamento dos novos campos no model.
   * Ajustes visuais na aba "Análise IA" da partida (selos e ícones nos chips).
3. **Dia 3: Interface do Dashboard**
   * Desenvolvimento da tela "Desempenho da IA" com gráficos de precisão e auditoria.
   * Registro da tela na navegação do menu lateral (Drawer).
