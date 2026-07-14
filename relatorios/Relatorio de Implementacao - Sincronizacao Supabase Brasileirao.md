# Relatório de Implementação — Sincronização Supabase Brasileirão

**Data:** 13 de Julho de 2026 (Horário Local) / 14 de Julho de 2026 (UTC)  
**Horário de Conclusão:** 23:05 (Fuso Horário Brasília - UTC-3)  
**Status:** 🚀 Deployado em Produção e 100% Funcional  

---

## 📋 Resumo Executivo
Este documento oficializa a entrega e a validação do serviço de sincronização autônomo entre o banco de dados do **Supabase Hosted** (`zapscore-supabase-brasileirao.gtalg3.easypanel.host`) e a **ZapScore API** (`zapscore-zapscore-api.gtalg3.easypanel.host`) para competições monitoradas, com foco inicial no Brasileirão Série A (Liga ID 71, Temporada 2026).

---

## 🛠️ Detalhes da Implementação

### 1. Desacoplamento e Segurança (ZapScore API Intocada)
A ZapScore API original permaneceu **100% intocada**. Todas as alterações e dependências adicionadas experimentalmente no projeto `apps/api` (incluindo o cliente Supabase e variáveis no `.env`) foram revertidas. 

O novo serviço roda sob um container Docker standalone e isolado no EasyPanel na pasta:
👉 `d:\zapscore\apps\sync-supabase\`

### 2. O Mapeador de IDs Dinâmico (`IdMapper`)
Identificamos que o banco de dados do Supabase Hosted já possuía registros e UUIDs de times e partidas próprios gerados anteriormente. Para evitar quebras de chaves estrangeiras (`foreign key constraint`) e conflitos de chaves primárias, foi implementado o `IdMapper`:
- Ao iniciar, o serviço carrega em memória todos os IDs existentes das tabelas `leagues`, `teams` e `matches` do Supabase.
- Durante o fluxo de sincronização, o serviço mapeia em tempo real os relacionamentos usando os UUIDs correspondentes do Supabase em vez dos UUIDs internos do banco local da ZapScore API.

### 3. Frequência e Otimização dos Cron Jobs

| Cron Job | Agendamento | Frequência | Descrição / Otimização |
|---|---|---|---|
| `syncBootstrap` | `0 1 * * *` | Diário (01:00h) e no Startup | Sincroniza a Liga 71 (Série A) e todos os 20 times (upsert no Supabase). |
| `syncToday` | `*/30 * * * *` | A cada 30 minutos | Atualiza o status geral, placar e datas de todos os jogos do dia atual. |
| `syncLive` | `* * * * *` | A cada 1 minuto | Ativado apenas quando há partidas ao vivo em andamento. Atualiza placar, minuto, eventos (gols, cartões), estatísticas (JSONB) e escalações (JSONB). |
| `syncStandings` | `0 */6 * * *` | A cada 6 horas | Sincroniza a classificação oficial (`group_standings`) convertendo as FKs para os times corretos. |

### ⚡ Otimização do Consumo de Escalações (Lineups)
As escalações são enviadas pelas equipes cerca de 60 a 45 minutos antes da partida começar. 
Para poupar requisições na ZapScore API, o job `syncLive` realiza a consulta das escalações **apenas uma vez** por jogo. Assim que o registro é salvo no Supabase, o campo `last_lineups_sync_at` é preenchido na tabela `fixture_sync_control`, bloqueando novas consultas redundantes nos minutos seguintes.

---

## 📈 Resultados da Validação (Ambiente Produção EasyPanel)

Após o push do Dockerfile de multi-estágio compilar o TypeScript de forma limpa, o container foi iniciado com sucesso com o seguinte log de validação em produção:

```log
🚀 sync-supabase-brasileirao iniciado
   ZapScore API : https://zapscore-zapscore-api.gtalg3.easypanel.host
   Supabase URL : https://zapscore-supabase-brasileirao.gtalg3.easypanel.host
   Liga         : Brasileirão Série A (71)
   Temporada    : 2026

▶ Inicializando mapeamento de IDs e executando sync inicial...
[IdMapper] Inicializando mapas de IDs do Supabase...
[IdMapper] Mapeamento concluído: 8 ligas, 20 times, 380 matches em cache.
[sync-bootstrap] 2026-07-14T01:54:29.482Z — Iniciando...
[sync-bootstrap] ✅ Liga: Serie A
[sync-bootstrap] 20 time(s) encontrado(s).
[sync-bootstrap] ✅ Time: Bahia
...
[sync-bootstrap] ✅ Time: Palmeiras
[sync-bootstrap] Concluído.
[sync-today] 2026-07-14T01:54:29.871Z — Iniciando...
[sync-today] Nenhuma partida hoje.
[sync-standings] 2026-07-14T01:54:29.880Z — Iniciando...
[sync-standings] 20 posição(ões) encontrada(s).
[sync-standings] ✅ 1° Palmeiras — 41pts
[sync-standings] ✅ 2° Flamengo — 34pts
...
[sync-standings] ✅ 20° Chapecoense-sc — 9pts
[sync-standings] Concluído.
✅ Sync inicial concluído. Crons ativos.
```

O mapeamento de chaves e o fluxo de chaves estrangeiras foram aplicados sem nenhum erro no banco de dados do Supabase. O serviço está ativo e operando em produção de forma contínua.
