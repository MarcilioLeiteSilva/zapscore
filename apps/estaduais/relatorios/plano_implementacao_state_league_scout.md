# 🏆 Plano de Implementação — Agente State League Scout (Guardião Autônomo Multi-Estaduais)

> **Status:** `[PLANEJADO / APROVADO 🚀]`  
> **Classificação:** Agente Autônomo de Governança, Calendário e Resultados Regionais  
> **Módulos Afetados:** `apps/api` (ZapScore Central), `apps/web` (AdminPanel Telemetria)  
> **Impacto nos Clientes Mobile:** **Zero alteração necessária** (Consumo transparente via API existente)  
> **Primeiro Piloto Ativo:** Campeonato Pernambucano (Liga `622`, Temporada `2027`/2º Semestre)  
> **Extensibilidade:** Pronto para FGF (Gaúcho A2), FCF (Cearense), FERJ (Carioca), FPF-SP (Paulista), etc.

---

## 📑 Índice
1. [Visão Geral e Diagnóstico da Necessidade](#1-visão-geral-e-diagnóstico-da-necessidade)
2. [Diretrizes Rígidas e Princípios Arquiteturais](#2-diretrizes-rígidas-e-princípios-arquiteturais)
3. [Topologia do Agente State League Scout](#3-topologia-do-agente-state-league-scout)
4. [A Estratégia em Cascata Tripla (Prevenção de Atrasos)](#4-a-estratégia-em-cascata-tripla-prevenção-de-atrasos)
5. [Proteção de Cota e Convivência Não-Regressiva no Banco](#5-proteção-de-cota-e-convivência-não-regressiva-no-banco)
6. [Fases de Implementação Passo a Passo](#6-fases-de-implementação-passo-a-passo)
7. [Guia de Expansão para Novos Estaduais](#7-guia-de-expansão-para-novos-estaduais)

---

## 1. Visão Geral e Diagnóstico da Necessidade

### 1.1 O Descompasso Estrutural entre Provedores Globais e Federações
A API-Football (API-Sports) é um provedor global com sede na Europa. Em torneios regionais, copas de segundo semestre e divisões de acesso no Brasil:
1. **Alterações de Datas e Locais de Última Hora:** As federações estaduais brasileiras (ex: FPF, FGF, FERJ) publicam alterações de tabela por meio de resoluções e editais locais. A API-Football não tem integração em tempo real com esses atos administrativos, mantendo datas defasadas por dias ou semanas.
2. **Assimetria de Velocidade de Placares:**
   - **Federações:** O portal da federação frequentemente atrasa a digitação do placar final no site, pois seus processos burocráticos aguardam a súmula oficial do árbitro.
   - **Imprensa (GE Globo):** Repórteres de campo noticiam o apito final e o placar instantaneamente.
   - **API-Football:** Pode coletar o placar com atraso em relação ao apito final, ou, em torneios menores, sequer ter correspondente ao vivo.

### 1.2 Objetivo do Agente
O **State League Scout** nasce para agir como um operador autônomo inteligente:
* Monitora diretamente o calendário das **Federações Estaduais** para corrigir datas remarcadas de forma silenciosa e preventiva.
* Monitora o encerramento de partidas por **múltiplas fontes em cascata** (API-Football, GE Globo e Súmula da Federação).
* Registra o resultado final (`FT`), recalcula a classificação (`Standings`) e dispara eventos de tempo real **sem nenhuma intervenção humana**.

---

## 2. Diretrizes Rígidas e Princípios Arquiteturais

1. **100% Autônomo (Zero Digitação, Zero Clique):** O agente opera em segundo plano via workers periódicos do NestJS.
2. **Zero Aumento de Cota na API-Football:** A coleta das federações é realizada por HTTP direto e gratuito. A leitura da API-Football é passiva, aproveitando o cache global já existente.
3. **Idempotência e Regra Não-Regressiva:** Uma partida gravada como `FT` (Finalizada) com placar real nunca regride para `NS` por eventuais requisições defasadas de provedores externos.
4. **Intocabilidade dos Clientes Flutter:** O aplicativo móvel do estadual continua consumindo `GET /fixtures` e `GET /standings` normalmente. Nenhuma linha de código Dart é modificada.

---

## 3. Topologia do Agente State League Scout

```mermaid
flowchart TD
    subgraph FONTES_EXTERNAS [Fontes Externas Multi-Via]
        FPF["🏛️ Federação Oficial (Ex: FPF-PE)<br>Autoridade de Datas & Estádios"]
        GE["📰 GE Globo / Imprensa Local<br>Autoridade de Fim de Jogo Imediato"]
        APIS["📡 Cache Global API-Football<br>Dados Estruturados Passivos"]
    end

    subgraph BACKEND_API [ZapScore API Central (apps/api)]
        SCOUT["🤖 StateLeagueScoutService<br>(Orquestrador Central)"]
        DRIVER["🔌 Drivers por Federação<br>(FpfDriver, FgfDriver, etc.)"]
        SAFE_GUARD["🛡️ Trava Não-Regressiva<br>(max Status / Trava de FT)"]
        DB[("📂 PostgreSQL Central<br>Fixtures / Standings / Teams")]
        WS["📡 FixturesGateway (Socket.io)"]
        PUSH["🔔 PushNotificationService (FCM)"]
    end

    subgraph CLIENTES_E_PAINEL [Consumo Transparente]
        APP["📱 App Flutter (Ex: Pernambucano)"]
        ADMIN["🖥️ AdminPanel: Telemetria Passiva"]
    end

    FPF --> DRIVER
    GE --> SCOUT
    APIS --> SCOUT
    DRIVER --> SCOUT
    SCOUT --> SAFE_GUARD
    SAFE_GUARD --> DB
    DB --> WS --> APP
    DB --> PUSH --> APP
    SCOUT --> ADMIN
```

---

## 4. A Estratégia em Cascata Tripla (Prevenção de Atrasos)

Para garantir que o torcedor sempre veja a data certa e o placar final sem atrasos:

### Ciclo 1: Auto-Alinhamento de Calendário (A cada 6 horas)
* **Fonte Primária:** Portal Oficial da Federação (ex: FPF).
* **Ação:**
  1. Varre os jogos agendados com status `NS` (Not Started).
  2. Compara `Time Mandante x Time Visitante` com o cronograma oficial da federação.
  3. Se a federação remarcou a partida (ex: de 20/10 para 24/10 às 15h00 no Limeirão), o agente atualiza silenciosamente os campos `date`, `round` e `venueName` no banco.

### Ciclo 2: Auto-Encerramento de Partidas (A cada 10 min em dias de jogos)
Quando o horário previsto do jogo já passou (`now >= date + 105 minutos`):
O agente ativa a checagem inteligente em 3 níveis:
1. **1º Nível (Cache da API-Football):** Verifica se a partida já entrou em `FT` no cache diário do `syncToday`. Se sim, absorve o placar e encerra.
2. **2º Nível (Feed GE Globo / Imprensa):** Se a API-Football ainda marcar `NS`, o agente checa o feed/tempo real do GE para aquele confronto regional. Se a matéria cravar o apito final (ex: *"Central vence Ypiranga por 1 a 0 no Lacerdão"*), extrai o placar e encerra como `FT`.
3. **3º Nível (Súmula da Federação):** Se as etapas anteriores falharem, absorve o placar assim que o portal da federação registrar o resultado da súmula.

---

## 5. Proteção de Cota e Convivência Não-Regressiva no Banco

### 5.1 Regra Matemática de Não-Regressão de Status
Para evitar que uma rotina externa desatualizada sobrescreva uma partida já finalizada pelo agente, o método `upsert` e `update` em `sync.service.ts` adota a seguinte regra:

```typescript
// Se a partida local já está FT (Finalizada), impede que status defasados (NS, 1H) regridam o jogo
const isLocalFinished = ['FT', 'AET', 'PEN'].includes(currentFixture.statusShort);
const isIncomingFinished = ['FT', 'AET', 'PEN'].includes(incomingData.statusShort);

if (isLocalFinished && !isIncomingFinished) {
  // Ignora atualização de status/gols regressiva vinda de APIs com delay
  delete incomingData.statusShort;
  delete incomingData.statusLong;
  delete incomingData.homeGoals;
  delete incomingData.awayGoals;
}
```

### 5.2 Idempotência de Push Notifications
* Cada partida possui a flag booleana `notifiedEnd: true`.
* Ao consolidar o fim de jogo (`FT`), o push é disparado **uma única vez**.
* Sincronizações posteriores da API-Sports detectam a flag e não reenviem notificações para os torcedores.

---

## 6. Fases de Implementação Passo a Passo

### Fase 1: Arquitetura de Drivers no Backend (`apps/api`)
1. Criar o diretório `apps/api/src/competitions/state-scout/`.
2. Definir a interface padrão de driver:
   ```typescript
   export interface StateScoutMatch {
     homeTeam: string;
     awayTeam: string;
     date: Date;
     round?: string;
     venue?: string;
     homeScore?: number | null;
     awayScore?: number | null;
     isFinished: boolean;
   }

   export interface FederationDriver {
     leagueExternalId: number;
     fetchSchedule(): Promise<StateScoutMatch[]>;
   }
   ```
3. Implementar o driver oficial da FPF (`fpf.driver.ts`) consumindo `https://fpf-pe.com.br/pt/competicoes/jogos_ajax_ver2.php` com parser rápido e leve.

### Fase 2: Serviço do Agente (`StateLeagueScoutService`)
1. Injetar `PrismaService`, `SyncService`, `FixturesGateway` e drivers registrados.
2. Implementar métodos:
   - `reconcileSchedule(leagueId: number)`: Alinha datas e locais.
   - `reconcileMatchResults(leagueId: number)`: Encerra jogos concluídos e recalcula `Standings`.
3. Adicionar trava não-regressiva no `SyncService`.

### Fase 3: Agendamento Autônomo (`SyncJobsService`)
1. `@Cron('0 6,14 * * *')`: Rotina de alinhamento de calendário FPF 2 vezes ao dia.
2. `@Cron('*/10 * * * *')`: Rotina de monitoramento de placares em janelas de partidas ativas.

### Fase 4: Telemetria Passiva no AdminPanel (`apps/web`)
1. Criar a tela `/adminpanel/agents/state-scout`.
2. Cards de telemetria sem botões de clique:
   - Status do Daemon: `🟢 100% AUTÔNOMO`
   - Total de datas auto-ajustadas nas últimas 24h.
   - Total de placares auto-encerrados.
   - Log recente de auto-correções.

---

## 7. Guia de Expansão para Novos Estaduais

Quando qualquer outro estadual apresentar divergências de datas ou atrasos de provedor (ex: Gaúcho, Carioca, Cearense), o procedimento para conectá-lo ao **State League Scout** é estritamente cirúrgico:

1. **Criar o Driver da Federação:** Criar arquivo `drivers/<nome>.driver.ts` implementando a interface `FederationDriver`.
2. **Registrar no Módulo:** Adicionar o novo driver no array de drivers do `StateScoutModule`.
3. **Pronto:** O orquestrador central assume automaticamente o alinhamento de datas, as travas no banco e o recálculo de classificação para aquele estadual.

---

> **Documento Oficial de Referência:** Mantido em `apps/estaduais/relatorios/plano_implementacao_state_league_scout.md` para governança, auditoria e expansão do ecossistema ZapScore.
