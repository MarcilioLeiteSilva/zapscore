# Plano de Otimização de Requisições da API-Football

Este documento propõe uma reestruturação na sincronização ao vivo de partidas (Live Sync) do **ZapScore** para reduzir drasticamente o consumo diário de requisições da API-Football, resolvendo o problema de estouro de limites de cota da chave de API.

---

## ⚠️ Diagnóstico do Problema Atual

Atualmente, o cron job de sincronização de partidas ao vivo (`handleLiveUpdate`) roda **a cada 1 minuto**, 24 horas por dia, 7 dias por semana. Em cada execução, ele faz **7 requisições individuais** (uma para cada liga monitorada).
* **Fórmula de Consumo:** $7 \text{ requisições/min} \times 60 \text{ min} \times 24 \text{ horas} = \mathbf{10.080 \text{ requisições/dia}}$.
* **Impacto:** Chaves com planos gratuitos (limite de 100/dia) ou intermediários estouram rapidamente nas primeiras horas do dia, impedindo o início e a atualização dos jogos (como ocorreu na rodada das 11:00).

---

## 💡 Solução Proposta

Implementaremos duas otimizações que trabalharão juntas:

### 1. Chamada Global Única (Filtro em Memória)
Em vez de fazer 7 chamadas individuais de API filtrando por liga no endpoint externo, faremos **uma única chamada** buscando todas as partidas ao vivo do planeta (`live=all`) e filtraremos essas partidas em memória pelas ligas suportadas no código.

### 2. Ativação Inteligente sob Demanda (Pre-Check no Banco)
Antes de realizar a chamada HTTP para o servidor externo da API-Football, o cron job fará uma verificação no banco de dados local para constatar se existe alguma partida que atenda a um dos critérios abaixo:
* O status do jogo no banco local já é ao vivo (`1H`, `2H`, `HT`, `ET`, `P`, `BT`, `LIVE`).
* O horário de início do jogo (`date`) está previsto para os próximos **15 minutos** (janela de aquecimento/espera).
* O jogo iniciou há menos de **3 horas** e o status atual no banco local é não iniciado (`NS`), indicando que a partida deveria ter começado mas a sincronização ao vivo ainda não a ativou.

Se nenhuma partida se enquadrar nesses critérios, o cron job do ZapScore registrará um log informativo e **interromperá a execução imediatamente, sem fazer nenhuma chamada externa**.

---

## 📊 Comparativo de Consumo Estimado

| Estratégia | Requisições/Minuto | Consumo em Dias sem Jogos | Consumo em Dias de Pico | Consumo Semanal Estimado |
| :--- | :---: | :---: | :---: | :---: |
| **Atual** | 7 | 10.080 / dia | 10.080 / dia | 70.560 |
| **Otimizado** | 1 (só com jogo) | **0** | **720** *(12h de jogos)* | **~1.750** *(redução de 97,5%)* |

---

## 🛠️ Mudanças Propostas no Código

### [Backend - NestJS API]

#### [MODIFY] [sync.service.ts](file:///d:/zapscore/apps/api/src/sync/sync.service.ts)
* Atualizar a função `syncLive` para:
  1. Consultar a API externa apenas uma vez via `apiFootball.getFixtures({ live: 'all' })`.
  2. Mapear o retorno e verificar quais partidas correspondem aos IDs das ligas monitoradas em `SUPPORTED_COMPETITIONS`.
  3. Processar o upsert e a sincronização de detalhes apenas para essas partidas correspondentes.

#### [MODIFY] [sync-jobs.service.ts](file:///d:/zapscore/apps/api/src/sync/sync-jobs.service.ts)
* Alterar o job `handleLiveUpdate` para realizar a verificação local no banco de dados (`PrismaService`) antes de invocar `syncService.syncLive()`.
* Caso não haja jogos ativos ou prestes a começar, registrar o log: `"No active or upcoming matches in the next 15 minutes. Skipping live update API call."` e abortar.

---

## 🧪 Plano de Verificação e Validação

### Testes Automatizados / Scripts
1. **Verificação de Consumo em Standby:**
   * Desativar os jogos ao vivo atuais no banco de dados de teste (mudar o status para finalizado ou agendado para o dia seguinte).
   * Forçar a execução do cron job de minuto a minuto e validar nos logs do NestJS se a mensagem de "Skipping..." é impressa, comprovando que nenhuma requisição externa de API-Football foi realizada.
2. **Verificação de Transição para Live:**
   * Agendar um jogo fictício de uma liga suportada para iniciar em 10 minutos (status `NS`).
   * Validar se o cron detecta o jogo e inicia as chamadas de sincronização com a API externa.

### Validação em Produção
* Acompanhar o gráfico de consumo de requisições no painel oficial da API-Football nas primeiras 24 horas após o deploy, garantindo que o consumo caia drasticamente nos períodos de madrugada e dias sem rodadas.
