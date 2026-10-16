# Guia de Implementação e Arquitetura: Push Notifications (Cluster Copas)

**Data de Implementação:** 16 de Outubro de 2026  
**Status:** 100% Implementado, Validado e Testado em Produção  
**Cluster:** Copas (`copadonordeste`, `copadobrasil`, `copalibertadores`)  
**Repositório:** `apps/copas/relatorios_copas/GUIA_IMPLEMENTACAO_PUSH_COPAS.md`  

---

## 1. Visão Geral da Arquitetura

O ecossistema ZapScore opera notificações através de instâncias descentralizadas do PocketBase agrupadas por cluster, desacoplando o tráfego de push de cada modalidade e garantindo isolamento total de credenciais FCM e assinaturas.

O cluster **Copas** agrega:
1. **Copa do Nordeste** (`copadonordeste` | ID API-Football: `612` | Pacote: `com.prolaser.copadonordestebr`)
2. **Copa do Brasil** (`copadobrasil` | ID API-Football: `73`)
3. **Copa Libertadores** (`copalibertadores` | ID API-Football: `13`)

```
[AdminPanel / API Central NestJS]
             │
             │ (POST /notifications/broadcast)
             ▼
[PocketBase Copas: https://zapscore-pocketbase-copas.gtalg3.easypanel.host]
   ├── pb_hooks/broadcast.pb.js       (Endpoint: POST /api/broadcast-push)
   ├── pb_hooks/notifications.pb.js   (Cron a cada 1 min + GET /api/test-notifications)
   └── Credenciais Google OAuth2 / FCM
             │
             │ (Google OAuth2 + FCM v1 HTTP API)
             ▼
[Google Firebase Cloud Messaging (FCM)]
             │
             │ (Token FCM unívoco)
             ▼
[App Móvel Flutter: Copa do Nordeste]
   └── Canal: copadonordeste_live_channel (Importance.max / Som / Vibração)
```

---

## 2. PocketBase Copas (Servidor Easypanel)

### 2.1 URL e Acesso
- **URL Base:** `https://zapscore-pocketbase-copas.gtalg3.easypanel.host`
- **Dashboard Admin:** `https://zapscore-pocketbase-copas.gtalg3.easypanel.host/_/`

### 2.2 Coleções Criadas e Estrutura de Schemas

| Coleção | Tipo | Descrição e Campos Principais |
| :--- | :--- | :--- |
| **`apps`** | Base | Catálogo de aplicativos ativos no cluster.<br>• `name` (text, ex: "Copa do Nordeste")<br>• `app_slug` (text, unívoco, ex: "copadonordeste")<br>• `league_id` (number, ex: 612)<br>• `active` (bool) |
| **`subscriptions`** | Base | Registro dos dispositivos com tokens FCM.<br>• `device_id` (text, unívoco por aparelho)<br>• `app_slug` (text)<br>• `fcm_token` (text)<br>• `notify_goals` (bool, default: true)<br>• `notify_start` (bool, default: true)<br>• `notify_end` (bool, default: true)<br>• `favorite_teams` (json / array)<br>• `favorite_fixtures` (json / array) |
| **`match_cache`** | Base | Estado das partidas monitoradas em tempo real.<br>• `fixture_id` (number, indexado)<br>• `league_id` (number)<br>• `status` (text, ex: "1H", "2H", "FT")<br>• `home_score` (number)<br>• `away_score` (number)<br>• `home_team_id` (number)<br>• `away_team_id` (number)<br>• `last_event_hash` (text)<br>• `minute` (text) |
| **`notification_logs`** | Base | Auditoria de disparos realizados.<br>• `app_slug` (text)<br>• `fixture_id` (number)<br>• `event_type` (text, ex: "goal", "start", "end", "broadcast")<br>• `title` (text)<br>• `body` (text)<br>• `sent_count` (number)<br>• `failed_count` (number)<br>• `status` (text) |

---

## 3. Implementação dos Hooks (`apps/copas/pb_hooks`)

### 3.1 Arquivos e Funções
- **`broadcast.pb.js`**: Implementa a rota HTTP `POST /api/broadcast-push`.
  - Usado para disparo de notícias, resumos manuais do AdminPanel e House Ads.
  - Suporta enriquecimento com imagens (`imageUrl` / BigPicture).
  - Faz fallback para leitura de payload em múltiplos formatos (`$apis.requestInfo`, `readerToString`, `c.bind` e query parameters).
- **`notifications.pb.js`**: 
  - Rota de diagnóstico: `GET /api/test-notifications?app=copadonordeste&simulate=true`.
  - Cron Job: `cronAdd("check_copas_live_matches", "*/1 * * * *", ...)` que consome a API central (`/fixtures?status=LIVE`), detecta gols, início e fim de jogo, aplicando regras de filtro por time favorito.

### 3.2 Problemas Enfrentados e Soluções Definitivas

> [!IMPORTANT]
> **Solução 1: Estrutura Baseada no Cluster Brasil**  
> Os hooks do PocketBase rodam no engine JavaScript **Goja**. A estrutura do cluster `apps/brasil/pb_hooks` é a referência estável e comprovada em produção. Qualquer criação de novos clusters deve sempre derivar dos arquivos do Brasil para manter compatibilidade 100%.

> [!WARNING]
> **Solução 2: Erro de Redeclaração no Escopo (`Identifier '_base64UrlEncode' has already been declared`)**  
> No PocketBase, funções declaradas com `function nome()` no topo do mesmo arquivo compartilham o escopo léxico. Certifique-se de que cada helper (`_base64UrlEncode`, `_sha256Bytes`, `_parsePkcs8Der`) esteja isolado dentro de suas respectivas rotas/handlers para evitar conflitos de hoisting.

> [!CAUTION]
> **Solução 3: Erro de Divisão por Zero no Parser ASN.1 RSA (`RangeError: Division by zero`)**  
> Ao extrair os números inteiros do buffer DER PKCS#8 de uma chave privada RSA do Google Service Account, nunca invoque `readInteger()` duas vezes consecutivas além dos limites do buffer.  
> **Forma Correta:**
> ```javascript
> var n = readInteger();
> var e = readInteger();
> var d = readInteger();
> var p = readInteger();
> var q = readInteger();
> var dmp1 = readInteger();
> var dmq1 = readInteger();
> var iqmp = readInteger();
> return { n: n, e: e, d: d, p: p, q: q, dmp1: dmp1, dmq1: dmq1, iqmp: iqmp };
> ```
> O motor calcula o exponencial modular com Teorema Chinês do Resto (CRT) via `_modPow(m % p, dmp1, p)` e `_modPow(m % q, dmq1, q)`. Se `p` for lido incorretamente como zero, o Goja lança divisão por zero.

---

## 4. Integração com a API Central NestJS (`apps/api`)

Arquivo: `apps/api/src/notifications/notifications.service.ts`

### 4.1 Roteamento Dinâmico para PocketBase Copas
```typescript
private readonly PB_COPAS = 'https://zapscore-pocketbase-copas.gtalg3.easypanel.host';

private resolvePocketBaseTarget(leagueId?: number, appSlug?: string): { url: string; slug: string; name: string } | null {
  const slug = (appSlug || '').toLowerCase().trim();
  const id = leagueId ? Number(leagueId) : 0;

  // Copas: Copa do Nordeste (612), Copa do Brasil (73), Libertadores (13)
  const copasSlugs: Record<string, number> = {
    copadonordeste: 612,
    copadobrasil: 73,
    copalibertadores: 13,
  };

  if (copasSlugs[slug] || [612, 73, 13].includes(id)) {
    let resolvedSlug = slug;
    if (!resolvedSlug) {
      resolvedSlug = Object.keys(copasSlugs).find((k) => copasSlugs[k] === id) || '';
    }
    if (resolvedSlug) {
      return { url: this.PB_COPAS, slug: resolvedSlug, name: 'PocketBase Copas' };
    }
  }
  // ... Brasil, Europa e Estaduais
}
```

### 4.2 Endpoint Gateway de Broadcast
- Endpoint: `POST /notifications/broadcast`
- Payload aceito:
```json
{
  "leagueId": 612,
  "appSlug": "copadonordeste",
  "title": "📰 Título da Notícia",
  "body": "Texto curto para exibição no lock screen",
  "imageUrl": "https://url-da-imagem.jpg",
  "dataPayload": {
    "type": "news",
    "id": "12345",
    "league_id": "612",
    "app_slug": "copadonordeste"
  }
}
```

---

## 5. Integração com o AdminPanel (`apps/web`)

### 5.1 Agente Publisher / Notícias (`apps/web/app/(main)/adminpanel/agents/publisher/page.tsx`)
1. **`resolveLeagueInfo()`**:
   ```typescript
   if (extId === 612 || nameLower.includes('nordeste')) {
     return {
       leagueIdForPrisma: prismaId,
       externalId: 612,
       appSlug: 'copadonordeste',
       appName: 'Copa do Nordeste',
     };
   }
   ```
2. **`competitionGroups`**: Adicionado o card agrupador `☀️ Copa do Nordeste`.
3. **`defaultLeagues`**: Adicionado `{ id: '612', name: 'Copa do Nordeste' }`.

### 5.2 Agente de Push Inteligente (`apps/web/app/(main)/adminpanel/agents/push/page.tsx`)
Inclusão no array `COMPETITIONS`:
```typescript
{ id: 612, name: "Copa do Nordeste", slug: "copadonordeste", country: "Brasil", cluster: "Copas" },
{ id: 73, name: "Copa do Brasil", slug: "copadobrasil", country: "Brasil", cluster: "Copas" },
{ id: 13, name: "Copa Libertadores", slug: "copalibertadores", country: "América do Sul", cluster: "Copas" },
```

---

## 6. Cliente Flutter (`apps/copas/copadonordeste`)

### 6.1 Configuração Base
- Arquivo: `lib/helpers/app_config.dart`
  ```dart
  static const String pocketbaseBaseUrl = 'https://zapscore-pocketbase-copas.gtalg3.easypanel.host';
  static const String appSlug = 'copadonordeste';
  ```

### 6.2 PushNotificationService
- Arquivo: `lib/services/push_notification_service.dart`
- **Canal de Alta Prioridade (Android 8+)**:
  ```dart
  const AndroidNotificationChannel(
    'copadonordeste_live_channel',
    'Alertas Copa do Nordeste',
    description: 'Gols e notificações em tempo real',
    importance: Importance.max,
  )
  ```
- **Sincronização com o PocketBase**:
  - Gera ou recupera `zapscore_device_unique_id`.
  - Salva/atualiza registro na coleção `subscriptions` com o token FCM obtido pelo Firebase.

---

## 7. Roteiro de Expansão para Novas Copas (`copadobrasil` e `copalibertadores`)

Quando chegar o momento de ativar a **Copa do Brasil** e a **Copa Libertadores**:

1. **Ativar no Banco PocketBase Copas:**
   - Acesse a coleção `apps` e mude o registro correspondente para `active: true` (ID `73` para Copa do Brasil ou `13` para Libertadores).
2. **Adicionar Chave Firebase do App:**
   - Coloque o arquivo `service_account_copadobrasil.json` ou `service_account_copalibertadores.json` dentro de `/pb_hooks/` no Easypanel (ou adicione no objeto `_EMBEDDED_FIREBASE_CONFIGS` dentro dos dois `.pb.js`).
3. **Configurar o App Flutter:**
   - Adicionar o `google-services.json` respectivo no app Flutter.
   - Definir `appSlug` e apontar o `AppConfig.pocketbaseBaseUrl` para `https://zapscore-pocketbase-copas.gtalg3.easypanel.host`.
4. **Testar Diagnóstico:**
   - Chamar: `https://zapscore-pocketbase-copas.gtalg3.easypanel.host/api/test-notifications?app=copadobrasil&simulate=true`.
