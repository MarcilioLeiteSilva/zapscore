# Sugestões de Novas Categorias de Dados com IA no ZapScore

Este documento apresenta ideias estruturadas de novos dados e recursos de inteligência artificial que podem ser implementados e disponibilizados na **ZapScore API** e no **Aplicativo Móvel** no futuro.

---

## 1. Categorias de Dados Propostas

### 1.1. Previsões de Mercado Puras (AI Predictions)
Dados quantitativos focados em probabilidades matemáticas para os mercados de apostas mais populares.
* **Métricas**:
  * `probHome`, `probDraw`, `probAway` (já implementado, 1X2).
  * `probBTTS` (Both Teams to Score - Sim/Não em porcentagem).
  * `probOver1_5`, `probOver2_5`, `probUnder2_5` (Mercado de gols).
  * `probDoubleChance` (Mandante ou Empate, Visitante ou Empate, Mandante ou Visitante).
* **Uso**: Ideal para alimentar feeds compactos de estatísticas, pílulas rápidas na home e alertas push automáticos pré-jogo.

### 1.2. Análise Tática e Comparativa (Tactical Insights)
Análise conceitual e estratégica sobre a partida baseada nos desfalques, formações táticas oficiais e estilo de jogo de cada técnico.
* **Métricas**:
  * `tacticalPreview` (Comentário textual focado na armação tática).
  * `keyDuels` (Lista contendo duelos de destaque em campo, ex: ponta rápido vs. lateral amarelado).
  * `weaknessIdentified` (Pontos vulneráveis de cada equipe para a partida).
* **Uso**: Exibição em abas exclusivas para usuários que buscam análises técnicas profundas sobre clássicos e partidas importantes.

### 1.3. Fator Escalação (Lineup Impact Index)
Avaliação de como a escalação oficial divulgada impactou as chances reais de vitória em comparação com a estimativa anterior.
* **Métricas**:
  * `lineupVariance` (Diferença percentual pré-jogo vs. pós-escalações oficiais).
  * `keyMissingPlayerImpact` (Resumo da ausência de jogadores titulares e o impacto tático gerado).
* **Uso**: Atualização em tempo real na aba de IA assim que as escalações são confirmadas pela equipe de arbitragem (geralmente 1h antes do jogo).

### 1.4. Palpites de Valor (Value Bets Finder)
Módulo inteligente que compara as probabilidades calculadas pela IA com as odds de mercado vigentes e identifica onde há margem de lucro estatística.
* **Métricas**:
  * `oddFair` (Odd justa calculada pela IA baseada na probabilidade).
  * `suggestedMarket` (Mercado sugerido para a aposta de valor).
  * `edge` (Porcentagem de vantagem sobre a casa de apostas).
* **Uso**: Ideal para uma seção premium do aplicativo voltada a apostadores táticos (ex: "Palpites do Dia").

---

## 2. Abordagem Técnica de Implementação

### 2.1. Alterações no Prisma Schema (`schema.prisma`)
Para suportar essas novas colunas e estatísticas, o modelo `FixtureAiAnalysis` pode ser estendido no futuro:

```prisma
model FixtureAiAnalysis {
  id                String   @id @default(uuid())
  fixtureId         String   @unique @map("fixture_id")
  fixture           Fixture  @relation(fields: [fixtureId], references: [id], onDelete: Cascade)
  
  // Dados já existentes
  probHome          Int      @map("prob_home")
  probAway          Int      @map("prob_away")
  probDraw          Int      @map("prob_draw")
  predictionSummary String   @map("prediction_summary") @db.Text
  tips              Json     // Lista de strings
  commentary        String   @db.Text
  lineupsFactored   Boolean  @default(false) @map("lineups_factored")
  
  // Novos campos sugeridos
  probBTTS          Int?     @map("prob_btts")       // Porcentagem de Ambas Marcam
  probOver25        Int?     @map("prob_over_25")    // Porcentagem de Mais de 2.5 Gols
  keyDuels          Json?    @map("key_duels")       // Duelos chave estruturados
  tacticalOverview  String?  @map("tactical_overview") @db.Text
  lineupVariance    Float?   @map("lineup_variance")  // Variação de probabilidade
  
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@map("fixture_ai_analysis")
}
```

### 2.2. Atualização no Prompt do Backend (`ai.service.ts`)
O prompt enviado ao Gemini/OpenAI deve solicitar formalmente o preenchimento das novas chaves no JSON schema de retorno:

```typescript
// Exemplo de esquema JSON esperado no retorno do LLM:
const responseSchema = {
  type: "object",
  properties: {
    probHome: { type: "integer" },
    probAway: { type: "integer" },
    probDraw: { type: "integer" },
    probBTTS: { type: "integer" },
    probOver25: { type: "integer" },
    predictionSummary: { type: "string" },
    tips: { type: "array", items: { type: "string" } },
    commentary: { type: "string" },
    keyDuels: {
      type: "array",
      items: {
        type: "object",
        properties: {
          players: { type: "string" }, // Ex: "Lucero vs. Luiz Otávio"
          description: { type: "string" } // Detalhe técnico do duelo
        }
      }
    }
  },
  required: ["probHome", "probAway", "probDraw", "probBTTS", "probOver25", "predictionSummary", "tips", "commentary"]
};
```

### 2.3. Exposição de Endpoints na API NestJS
A ZapScore API pode expor endpoints divididos de acordo com o nível de acesso do usuário (público ou VIP/premium):

* `GET /fixtures/:id/ai-predictions` (Livre - Exibe apenas as probabilidades e palpites rápidos).
* `GET /fixtures/:id/ai-tactical` (Premium - Exibe a análise detalhada, duelos táticos e desvio de odds).

---

## 3. Benefícios Comerciais e de Engajamento

1. **Aumento do Tempo de Tela**: Textos ricos em comentários táticos engajam os torcedores muito mais tempo no app antes das partidas começarem.
2. **Nova Fonte de Receita**: Lançar um plano "Premium" ou "Pro" que desbloqueia os palpites táticos avançados e o Value Bets Finder.
3. **Diferenciação de Mercado**: A maioria dos apps concorrentes exibe apenas estatísticas brutas de robôs; a análise em linguagem natural e contextual diferencia o ZapScore de forma inovadora.
