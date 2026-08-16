# Relatório Técnico: Implementação de Notificações Push FCM HTTP v1 via PocketBase JS Hooks
**Data:** 16 de Agosto de 2026  
**Projeto:** Zapscore Europa (Template Base para Módulo Estaduais e Demais Ligas)  
**Autor:** Antigravity AI Pair Programmer  

---

## 1. Sumário Executivo

Este documento consolida a arquitetura completa, os desafios superados, as soluções de engenharia implementadas e o roteiro exato para replicação do sistema de **Notificações Push em Tempo Real via PocketBase JS Hooks** nos aplicativos do **Módulo Estaduais** (ex: Copa do Nordeste, Paulistão, Cariocão, etc.) e demais módulos do Zapscore.

O sistema opera de forma **100% autônoma e serverless** dentro da instância do PocketBase, sem necessitar de microsserviços Node.js externos para o envio de pushes, integrando-se diretamente à **API Google Firebase Cloud Messaging HTTP v1** através de criptografia **OAuth2 RS256 nativa em JavaScript puro**, com gerenciamento avançado de presença única do cliente e auto-expurgo de tokens obsoletos.

---

## 2. Arquitetura da Solução

```mermaid
flowchart TD
    A[Cron Job PocketBase: zapscore_live_sync] -->|A cada 1 minuto| B[Consulta Zapscore API: /fixtures?status=LIVE]
    B --> C{Há jogos das ligas monitoradas?}
    C -->|Não| D[Verifica Fim de Jogo para partidas em cache: /fixtures/today]
    C -->|Sim| E[Compara Placar e Minuto com match_cache]
    E --> F{Houve Evento?}
    F -->|Início / 1H| G[Dispara Notificação: INÍCIO DE JOGO]
    F -->|Gol Mandante / Visitante| H[Dispara Notificação: GOL]
    F -->|Fim / FT| I[Dispara Notificação: FIM DE JOGO]
    G & H & I --> J[Consulta assinantes na coleção 'subscriptions']
    J --> K[Gera Google OAuth2 RS256 Access Token]
    K --> L[Dispara Push via FCM HTTP v1 API]
    L --> M{Resposta do Google FCM}
    M -->|200 OK| N[Notificação Entregue ao Aparelho]
    M -->|404 / NotRegistered| O[Auto-Expurgo: $app.dao().deleteRecord]
```

---

## 3. Particularidades Críticas do Goja (PocketBase JS Engine)

O PocketBase utiliza o **Goja** (um runtime JavaScript escrito em Go) para executar os arquivos `.pb.js`. O desenvolvimento para Goja possui peculiaridades fundamentais que foram mapeadas e resolvidas:

### 3.1. Isolamento de Escopo por Handler (Router vs Cron)
* **Desafio:** No PocketBase v0.20+, cada requisição HTTP tratada por `routerAdd` e cada execução de `cronAdd` é avaliada em instâncias/contextos isolados. Funções auxiliares declaradas no escopo global fora dos handlers frequentemente não são herdadas pelos contextos internos dos callbacks, gerando `ReferenceError`.
* **Solução:** O motor de envio (`getFirebaseConfig`, `getGoogleAccessToken`, `_signJwt`, `sendFcmPush`) foi implementado de forma **totalmente autossuficiente e encapsulada** dentro de cada bloco de execução (`routerAdd` e `cronAdd`).

### 3.2. Go Slices vs JavaScript Arrays (`.includes()`)
* **Desafio:** Quando o PocketBase retorna campos JSON/Array do banco de dados (ex: `favorite_teams` da coleção `subscriptions`), o Goja disponibiliza o dado como um *slice do Go* (`[]interface{}` ou `types.JsonArray`). Objetos nativos do Go **não possuem métodos de protótipo do JS como `.includes()`**. Chamar `favs.includes(...)` falhava silenciosamente e abortava o envio do lote de notificações (causando o sintoma de `0/52 enviadas`).
* **Solução:** Implementação de parsing defensivo e iteração por laço `for` clássico:
  ```javascript
  var favs = sub.get("favorite_teams");
  var isFavorite = true;
  if (favs) {
      var favList = [];
      try {
          if (Array.isArray(favs)) {
              favList = favs;
          } else if (typeof favs === "string" && favs.length > 0 && favs !== "[]") {
              favList = JSON.parse(favs);
          } else if (typeof favs.length === "number") {
              for (var f = 0; f < favs.length; f++) favList.push(favs[f]);
          }
      } catch (_) {}

      if (favList && favList.length > 0) {
          var hStr = String(homeTeamId);
          var aStr = String(awayTeamId);
          isFavorite = false;
          for (var f = 0; f < favList.length; f++) {
              var item = String(favList[f]);
              if (item === hStr || item === aStr) {
                  isFavorite = true;
                  break;
              }
          }
      }
  }
  ```

### 3.3. Criptografia Criptográfica Autossuficiente (RS256 / SHA-256 / BigInt)
* **Desafio:** O Goja não possui o módulo `crypto` do Node.js nem o Web Crypto API. Para autenticar com o Google OAuth2 sem dependências binárias ou SDKs externos, foi necessário implementar a pilha de criptografia RS256 diretamente em JS puro:
  1. Parser ASN.1 DER PKCS#8 para extrair os componentes da chave privada RSA (`n`, `e`, `d`, `p`, `q`, `dmp1`, `dmq1`, `iqmp`).
  2. Implementação do algoritmo SHA-256 em nível de bytes.
  3. Padding PKCS#1 v1.5 com prefixo DigestInfo ASN.1.
  4. Exponenciação modular com Teorema Chinês do Resto (CRT) usando `BigInt`.
  5. Codificação Base64URL RFC 7515.

### 3.4. Auto-Expurgo de Tokens Mortos no PocketBase (`$app.dao().deleteRecord`)
* **Desafio:** Quando um usuário desinstala o aplicativo, o Google FCM invalida seu token e retorna `404 Not Found` com erro `UNREGISTERED` ou `NotRegistered`. Manter esses registros no banco de dados causaria degradação contínua da performance de envio de push.
* **Solução:** No hook de envio (`notifications.pb.js`), caso o Google responda status `404` ou código `UNREGISTERED`, o PocketBase invoca a DAO nativa para excluir o registro morto imediatamente do banco:
  ```javascript
  if (res.statusCode === 404 || (res.raw && (res.raw.indexOf("UNREGISTERED") >= 0 || res.raw.indexOf("NotRegistered") >= 0))) {
      try {
          $app.dao().deleteRecord(sub);
          console.log("[Auto-Expurgo] Token morto removido do PocketBase: " + token.substring(0, 15) + "...");
      } catch (delErr) {
          console.log("[Auto-Expurgo Error] " + delErr);
      }
  }
  ```

---

## 4. Gestão de Ciclo de Vida do Cliente Flutter (Heartbeat & Presença Única)

No lado dos aplicativos clientes (Flutter), foi implementada uma arquitetura robusta no `PushNotificationService` para garantir conformidade com o banco e evitar duplicações de registros:

### 4.1. Identificador Único Persistente por Aparelho (`deviceId`)
* Cada instalação gera e armazena localmente (`SharedPreferences`) uma chave única (ex: `dev_1771234567890_4521`).
* Permite correlacionar o aparelho físico com o registro no banco mesmo se o token do Google sofrer rotação.

### 4.2. Sincronização por `PATCH` (Presença Única)
* Ao iniciar o app (`initialize`), o serviço consulta a coleção `subscriptions` filtrando por `fcm_token = '$token' && app_slug = '$appSlug'`.
* Se o registro já existir, o cliente realiza apenas `PATCH`, atualizando a data de presença, times favoritos e perfil.
* Se for uma nova instalação, faz o `POST` inicial.

### 4.3. Bloqueio de Concorrência (`_isSyncing`) e Auto-Deduplicação Ativa
* A flag booleana `_isSyncing` bloqueia requisições assíncronas concorrentes durante o carregamento inicial de Cubits.
* Se a busca retornar mais de 1 registro com o mesmo token/slug (gerados por versões legadas), o app automaticamente faz `DELETE` dos registros excedentes, mantendo a base estritamente deduplicada (1 aparelho = 1 token = 1 registro).

### 4.4. Preservação de Perfil e Times Favoritos
* Todas as chamadas de sincronização consultam o `SharedPreferences` como fallback para preservar o apelido do usuário (`user_nickname`), nome (`user_name`) e lista de favoritos (`fav_teams`), impedindo que atualizações parciais de push restaurem valores padrão.

### 4.5. Escuta de Rotação de Token Google (`onTokenRefresh`)
* Listener configurado para detectar quando o Google Firebase renova o token do aparelho em segundo plano, disparando automaticamente a atualização do registro no PocketBase.

---

## 5. Estrutura de Coleções Necessária no PocketBase

Para qualquer instância do PocketBase (Europa, Estaduais, etc.), a estrutura de dados necessária é:

### 5.1. Coleção `apps` (Base de Configuração das Ligas)
| Campo | Tipo | Descrição |
|---|---|---|
| `app_slug` | Text (Unique) | Identificador do app (ex: `copanordeste`, `paulistao`) |
| `name` | Text | Nome legível da liga (ex: `Copa do Nordeste`) |
| `league_id` | Number | ID externo da liga na Zapscore API (ex: `620`) |
| `active` | Boolean | Se o monitoramento está ativo (`true`/`false`) |

### 5.2. Coleção `subscriptions` (Inscrições dos Usuários)
| Campo | Tipo | Descrição |
|---|---|---|
| `app_slug` | Text | Slug do aplicativo do qual o push veio |
| `fcm_token` | Text | Token de dispositivo gerado pelo Firebase SDK |
| `device_id` | Text | Identificador único local do aparelho |
| `user_name` | Text | Nome do usuário |
| `user_nickname` | Text | Apelido do usuário |
| `favorite_teams` | JSON / Text | Lista de IDs dos times favoritados `[123, 456]` (vazio = segue todos) |
| `notify_start` | Boolean | Notificar início de partida |
| `notify_goals` | Boolean | Notificar gols |
| `notify_end` | Boolean | Notificar fim de jogo |
| `platform` | Text | `android` ou `ios` |

### 5.3. Coleção `match_cache` (Estado e Histórico em Tempo Real)
| Campo | Tipo | Descrição |
|---|---|---|
| `fixture_id` | Number (Unique) | ID externo da partida na Zapscore API |
| `league_id` | Number | ID da liga |
| `home_team_id` | Number | ID do time mandante |
| `away_team_id` | Number | ID do time visitante |
| `home_score` | Number | Placar atual do mandante |
| `away_score` | Number | Placar atual do visitante |
| `status` | Text | Status curto (`1H`, `2H`, `HT`, `FT`, etc.) |
| `minute` | Text | Minutagem atual da partida (ex: `82`) |
| `last_event_hash` | Text | Hash/timestamp do último evento processado |

---

## 6. Status da Replicação nos Aplicativos Europeus

| Aplicativo | Slug (`app_slug`) | Push Service Atualizado | Presença Única (Heartbeat) | Auto-Expurgo no PB |
|---|---|:---:|:---:|:---:|
| **La Liga** | `laliga` | ✅ Sim (v1.0.3) | ✅ Sim | ✅ Sim |
| **Bundesliga** | `bundesliga` | ✅ Sim | ✅ Sim | ✅ Sim |
| **Ligue 1** | `ligue1-franca` | ✅ Sim | ✅ Sim | ✅ Sim |
| **Serie A** | `seriea-italia` | ✅ Sim | ✅ Sim | ✅ Sim |
| **Premier League** | `premierleague` | ✅ Sim | ✅ Sim | ✅ Sim |

---

## 7. Roteiro de Replicação para o Módulo Estaduais

Ao implementar o mesmo hook no PocketBase dos Estaduais (ex: `pocketbase-estaduais` ou `pocketbase-copanordeste`):

### Passo 1: Extrair a Service Account de Cada App do Módulo
1. Acessar o Firebase Console de cada app estadual.
2. Ir em **Configurações do Projeto > Contas de Serviço > Gerar Nova Chave Privada**.
3. Obter os dados: `project_id`, `client_email` e `private_key`.

### Passo 2: Cadastrar as Credenciais no Dicionário `_EMBEDDED_FIREBASE_CONFIGS`
Embutir no `notifications.pb.js` dos Estaduais o mapa com os slugs correspondentes:
```javascript
var _EMBEDDED_FIREBASE_CONFIGS = {
    "copanordeste": {
        "project_id": "appcopanordeste",
        "client_email": "firebase-adminsdk-fbsvc@appcopanordeste.iam.gserviceaccount.com",
        "private_key": "-----BEGIN PRIVATE KEY-----\n..."
    },
    "paulistao": {
        "project_id": "apppaulistao",
        "client_email": "firebase-adminsdk-fbsvc@apppaulistao.iam.gserviceaccount.com",
        "private_key": "-----BEGIN PRIVATE KEY-----\n..."
    }
};
```

### Passo 3: Cadastrar os Apps na Tabela `apps` do PocketBase
Adicionar os registros correspondentes com seus respectivos `league_id` da Zapscore API.

### Passo 4: Implantar o Hook no Servidor
1. Salvar o arquivo `notifications.pb.js` na pasta `/pb_hooks/` do PocketBase.
2. No Easypanel/Docker Swarm, atualizar o arquivo persistido no host (`/etc/easypanel/projects/zapscore/<serviço>/files/X.txt`) e reiniciar o serviço:
   ```bash
   docker service update --force zapscore_<pocketbase-servico>
   ```

### Passo 5: Testar via Endpoint de Diagnóstico
Realizar uma chamada HTTP GET para testar o envio com o token de teste:
```text
https://<pocketbase-url>/api/test-notifications?app=<app_slug>&token=<fcm_token>
```
Validar que a resposta retorna `oauth_status: "OAuth2 Token Generated Successfully"` e `test_push_sent.statusCode: 200`.

---

## 8. Conclusão

A arquitetura implantada demonstrou **100% de estabilidade e conformidade**:
- Autenticação OAuth2 RS256 nativa validada com sucesso em todos os 5 projetos Firebase Europeus.
- Disparo real de notificações push HTTP v1 executado com entrega confirmada pelo Google Cloud (`StatusCode: 200`).
- Auto-expurgo comprovado em tempo real ao desinstalar o app (remoção automática de tokens 404).
- Presença única garantida (1 aparelho = 1 registro no PocketBase).
- Monitoramento contínuo em tempo real via cron sem sobrecarga ou dependências externas.
- Isolamento estrito de código: zero alterações colaterais na API principal ou em outros módulos do Zapscore.
