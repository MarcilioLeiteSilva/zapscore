# Plano de Implementação: Análise, Palpites e Previsões com IA (ZapScore)

Este plano detalha o design técnico para criar a funcionalidade de análises, comentários e previsões automatizadas por Inteligência Artificial no ecossistema do ZapScore.

## 📋 Resumo da Funcionalidade
O backend central do ZapScore processará as estatísticas e informações de cada partida e usará um modelo de linguagem de última geração (LLM) para gerar:
1. **Probabilidades de Vitória/Empate** (Home, Away, Draw).
2. **Resumo da Previsão** (Uma frase curta de impacto).
3. **Dicas e Palpites de Jogo** (Ex: "Mais de 2.5 gols", "Ambos marcam").
4. **Comentário Técnico** (Análise descritiva contextualizando o momento dos times).

Essas informações serão salvas no banco de dados para consulta rápida pelos aplicativos (ex: Flutter Copa 2026).

---

## 🛠️ Mudanças Propostas

### 1. Banco de Dados / Persistência
Criaremos uma nova tabela no Prisma para armazenar e cachear as previsões.

#### [NEW] `schema.prisma` (Adicionar Modelo)
```prisma
model MatchAiAnalysis {
  id                  String   @id @default(uuid())
  matchId             String   @unique
  match               Match    @relation(fields: [matchId], references: [id], onDelete: Cascade)
  
  // Probabilidades de resultado
  probHome            Int      // ex: 45 (representando 45%)
  probAway            Int      // ex: 35
  probDraw            Int      // ex: 20
  
  // Conteúdos gerados pela IA
  predictionSummary   String   // Resumo rápido da previsão
  tips                String[] // Array de palpites rápidos (Ex: ["Ambos Marcam", "Mais de 1.5 gols"])
  commentary          String   @db.Text // Texto completo de análise
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@map("match_ai_analysis")
}

// E atualizar o model Match para incluir a relação:
// aiAnalysis  MatchAiAnalysis?
```

---

### 2. Backend (NestJS API - `apps/api`)

#### Variáveis de Ambiente (`.env`)
Adicionar chaves necessárias para chamar o serviço de IA:
```env
# Provedor padrão: GEMINI ou OPENAI
AI_PROVIDER=GEMINI
GEMINI_API_KEY=sua_chave_do_google_gemini
# Caso opte por OpenAI no futuro:
OPENAI_API_KEY=sua_chave_da_openai
```

#### [NEW] `ai.service.ts` (Integração com LLM)
* Criar um serviço para inicializar o cliente do Google Gen AI (Gemini) ou OpenAI.
* Implementar o método `generateMatchAnalysis(matchData: any): Promise<AiAnalysisResult>` com Engenharia de Prompt estruturada, forçando a IA a responder em JSON no seguinte formato:
```json
{
  "probHome": 48,
  "probAway": 28,
  "probDraw": 24,
  "predictionSummary": "Vitória provável do Brasil embalado pela torcida.",
  "tips": ["Brasil vence", "Mais de 2.5 gols no jogo"],
  "commentary": "O Brasil chega em excelente momento após a vitória no clássico..."
}
```

#### [NEW] `ai-sync.service.ts` (Fluxo de Geração e Atualização)
* Serviço responsável por ler dados completos da partida (nomes dos times, classificação recente, histórico de gols marcados/sofridos, desfalques ou escalações se disponíveis).
* Chamar o `AiService` para obter o JSON de análise e salvá-lo ou atualizá-lo na tabela `MatchAiAnalysis`.

#### [MODIFY] `sync-jobs.service.ts` (Agendamento Automático)
* Adicionar uma rotina agendada (Cron Job) que:
  1. Identifica os jogos das próximas 24 horas.
  2. Executa a geração inicial de análise de IA para eles.
* Adicionar um trigger no fluxo de sincronização de escalações: assim que a escalação oficial for importada (normalmente 1h antes do jogo), o backend dispara uma atualização rápida da IA para incorporar as escalações no prompt e refinar a previsão.

#### [NEW] `ai-analysis.controller.ts` (API Endpoint)
* Criar uma rota sob o prefixo `/fixtures/:id/ai-analysis` para ler as previsões salvas no banco de dados.
* Exemplo: `GET /fixtures/f5bf1948-f5ea-4ff8-8984-b175c02e08d3/ai-analysis`.

---

### 3. Aplicativo Mobile (Flutter)

#### Model e API Client
* Criar a classe `MatchAiAnalysis` no Flutter para mapear o JSON da API.
* Adicionar a chamada de rede no repositório de partidas:
  `Future<MatchAiAnalysis?> getMatchAiAnalysis(String matchId)`

#### Interface do Usuário (UI / Widgets)
* **Nova Aba nos Detalhes da Partida:** Adicionar a aba **"Análise IA"** (ao lado de "Lances", "Escalações" e "Estatísticas").
* **Gráfico de Probabilidades:** Criar um widget de barra tripla horizontal ou círculo de porcentagem (Progress Indicator) mostrando a divisão de probabilidade de vitória entre os dois times e o empate (Home vs Draw vs Away), usando as cores das seleções.
* **Seção de Palpites rápidos:** Exibir as dicas (`tips`) como badges/chips elegantes na tela.
* **Comentário Técnico:** Exibir o texto de análise em um card premium com tipografia limpa e destaque para a "assinatura da IA".

---

## 🔬 Plano de Verificação

### Testes do Backend
* Criar um script de teste em `scratch/test_ai_prompt.js` para simular o envio de dados de uma partida real à API do Gemini e imprimir a resposta da IA.
* Validar o parse de JSON retornado pela IA para garantir robustez (tratamento se a IA retornar texto livre ou falhar).
* Testar a rota do controller com `curl` ou Postman:
  `GET http://localhost:3000/fixtures/:id/ai-analysis` (deve retornar os dados formatados).

### Testes no Aplicativo
* Mockar os dados de análise de IA no Flutter para ajustar o layout antes de integrar a API real.
* Testar a responsividade e transição da tela de carregamento (Shimmer) enquanto a API responde.

---

## ❓ Perguntas Abertas / Decisões Requeridas

> [!IMPORTANT]
> **1. Qual modelo de IA utilizar como prioridade?**
> Sugerimos utilizar o **Gemini 1.5 Flash** (via Google AI Studio). Ele tem uma cota gratuita generosa de 15 requisições por minuto (RPM) e custa extremamente barato em produção, além de processar JSON muito bem. Concorda com essa escolha?
>
> **2. Idioma das Análises:**
> A IA gerará o texto técnico em português (`pt-BR`). No futuro, se houver planos para traduzir o aplicativo para outros idiomas, precisaremos enviar o idioma desejado como parâmetro ou traduzir via prompt. Mantemos focado em `pt-BR` por enquanto?
