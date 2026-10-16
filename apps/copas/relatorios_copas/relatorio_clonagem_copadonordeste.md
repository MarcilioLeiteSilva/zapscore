# Relatório de Clonagem e Implementação - App Copa do Nordeste

**Data:** 14 de Outubro de 2026  
**Status:** Concluído e Validado no Aparelho  
**Diretório do App:** `apps/copas/copadonordeste`  
**Base de Origem:** `apps/estaduais/cearense`  
**Destino do Relatório:** `apps/copas/relatorios_copas/relatorio_clonagem_copadonordeste.md`  

---

## 1. Visão Geral e Identificação

O app **Copa do Nordeste** foi clonado a partir da base estrutural de `apps/estaduais/cearense` e implementado cirurgicamente sob o diretório `apps/copas/copadonordeste`, em estrita conformidade com as diretrizes do [ECOSYSTEM.md](file:///d:/zapscore/relatorios/ECOSYSTEM.md) e regras de integridade do ecossistema ZapScore ([AGENTS.md](file:///d:/zapscore/.agents/AGENTS.md)).

| Parâmetro | Valor Configurado |
| :--- | :--- |
| **Nome da Aplicação** | Copa do Nordeste (Lampions League) |
| **Package / Application ID** | `com.prolaser.copadonordestebr` |
| **ID da Liga (API-Football)** | `612` (`COPA_DO_NORDESTE`) |
| **App Slug** | `copadonordeste` |
| **Backend PocketBase** | `https://zapscore-pocketbase-copanordeste.gtalg3.easypanel.host/` |
| **Firebase Project ID** | `copanordeste-4cf23` |
| **Keystore de Release** | `upload-keystore.jks` (alias: `upload`, senha: `password123`) |

---

## 2. Configurações de Serviços e Credenciais

### 2.1 Firebase & Push Notifications
- **Arquivo de Configuração**: `google-services.json` configurado em `android/app/google-services.json` para o pacote `com.prolaser.copadonordestebr`.
- **Chave de Serviço (FCM Server-Side)**: `service_account_copadonordeste.json` armazenada na raiz do projeto para deploy no hook do PocketBase.
- **Canal de Notificações**: Configurado em `lib/services/push_notification_service.dart`:
  - Channel ID: `copadonordeste_live_channel`
  - Channel Name: `Alertas Copa do Nordeste`
  - Descrição: `Notificações de gols, cartões e eventos da Copa do Nordeste`

### 2.2 Google AdMob (Monetização)
Os 5 blocos de anúncios de produção foram integrados em `lib/services/ad_service.dart` e manifest nativo:

| Formato | Ad Unit ID |
| :--- | :--- |
| **App ID (Manifest)** | `ca-app-pub-6887857057070736~8952696904` |
| **Banner** | `ca-app-pub-6887857057070736/7111662898` |
| **Interstitial** | `ca-app-pub-6887857057070736/5945920889` |
| **Nativo (Small & Medium)** | `ca-app-pub-6887857057070736/4000629146` |
| **Rewarded (Recompensado)** | `ca-app-pub-6887857057070736/4446475687` |

- **Native Ad Factories (Android & Flutter)**:
  - Fábrica Standard: `copadonordesteNativeAdFactory`
  - Fábrica Medium: `copadonordesteNativeAdFactoryMedium`
  - Registradas no `MainActivity.kt` em `android/app/src/main/kotlin/com/prolaser/copadonordestebr/`.

### 2.3 Keystore e Assinatura
- Arquivo `upload-keystore.jks` copiado para `APK/upload-keystore.jks`.
- `android/key.properties` configurado para apontar para `../APK/upload-keystore.jks`.
- `android/app/build.gradle.kts` configurado com `signingConfigs.getByName("release")` pronto para geração de bundles de publicação.

---

## 3. Identidade Visual, Tema e Assets

### 3.1 Paleta de Cores
Ajustada em [colors.dart](file:///d:/zapscore/apps/copas/copadonordeste/lib/helpers/colors.dart) para a identidade verde:

- **Fundo / Cor Padrão (`AppColor.background`, `appBarBackground`, `drawerBackground`)**: `#0F3822` (Verde Escuro)
- **Cards e Listas (`AppColor.card`)**: `#1B5938` (Verde tom mais claro, contraste de 8.5:1 com texto branco)
- **Tipografia (`AppColor.text`)**: `#FFFFFF` (Branco puro)
- **Destaques e Abas Ativas (`AppColor.accent`, `AppColor.darkGreen`)**: `#10B981` (Verde Esmeralda vibrante)
- **Cabeçalho do Menu Lateral (`AppColor.drawerHeader`)**: `#092416` (Verde Escuro Profundo)

### 3.2 Assets e Splash Screen
- **Logo Oficial Transparente**: Substituído por PNG 1024x1024 RGBA com transparência em `icones/app_logo.png`.
- **Ícone de Splash Seguro (45% de proporção)**:
  - Gerado em `icones/icone_splash_copadonordeste.png` (460x460 centralizado em canvas transparente 1024x1024 via interpolação Lanczos).
  - Garante que a máscara circular do **Android 12+** não corte nenhuma borda do emblema.
- **Ícone Interno**: `assets/icons/icone_transparente.png` atualizado para uso nos cabeçalhos do Drawer e tela Sobre.
- **Sincronização da Splash**: `flutter_native_splash` atualizado em `pubspec.yaml` com cor `#0F3822`.
- **Geração dos Pacotes**:
  - `dart run flutter_launcher_icons` (executado com sucesso)
  - `dart run flutter_native_splash:create` (executado com sucesso)

---

## 4. Modificações Estruturais e Cirúrgicas no Código

### 4.1 Camada Nativa Android
- `android/app/build.gradle.kts`:
  - `namespace = "com.prolaser.copadonordestebr"`
  - `applicationId = "com.prolaser.copadonordestebr"`
- `android/app/src/main/AndroidManifest.xml`:
  - Label: `"Copa do Nordeste"`
  - Meta-data AdMob: `ca-app-pub-6887857057070736~8952696904`
- Estrutura de pacotes Kotlin migrada para:
  `android/app/src/main/kotlin/com/prolaser/copadonordestebr/`
  - `MainActivity.kt`
  - `NativeAdFactorySmall.kt`
  - `NativeAdFactoryMedium.kt`

### 4.2 Camada Dart / Flutter
- `pubspec.yaml`:
  - Nome do pacote: `zapscore_copa_nordeste`
  - Descrição: `"App da Copa do Nordeste."`
- `lib/helpers/app_config.dart`:
  - `leagueId = '612'`
  - `externalLeagueId = 612`
  - `appSlug = 'copadonordeste'`
  - `pocketBaseUrl = 'https://zapscore-pocketbase-copanordeste.gtalg3.easypanel.host/'`
- `lib/presentation/widgets/fixture.dart`:
  - Remoção de abas estaduais desnecessárias (Série A/B etc.).
  - Foco exclusivo na Copa do Nordeste (612) com seletor dinâmico de rodadas/fases.
- `lib/presentation/screens/fixture/top_scorers.dart`:
  - Artilharia focada unicamente na competição da Copa do Nordeste.
- `lib/presentation/screens/home/news.dart`:
  - Filtro e curadoria de notícias direcionados aos clubes nordestinos participantes.
- Telas Regulatórias e Institucionais:
  - `lib/presentation/screens/settings/about_copadonordeste.dart`
  - `lib/presentation/screens/settings/privacy_policy.dart`
  - `lib/presentation/screens/settings/lgpd.dart`
  - `lib/presentation/screens/settings/general.dart` (links diretos da Google Play Store atualizados)
- PWA / Web:
  - `web/index.html` e `web/manifest.json` com nome "Copa do Nordeste" e cor `#0F3822`.

---

## 5. Auditoria de Qualidade e Validação

1. **Varredura de Resíduos Textuais**:
   - Busca em todo o projeto por referências residuais à base anterior (`cearense`, `estadual`).
   - Resultado: **0 ocorrências**.
2. **Análise Estática (`flutter analyze`)**:
   - Resultado: **0 erros**. 100% dos tipos, imports e contratos válidos.
3. **Teste em Dispositivo Real**:
   - `flutter run -d R9QL1043H7H` executado com sucesso no smartphone Samsung Galaxy (`SM A075M`).
   - Verificada a transição da Splash Screen com o novo ícone transparente e o tema verde escuro nos cards e telas de partidas.

---

## 6. Procedimento de Build para Publicação na Play Store

Para gerar os pacotes finais assinados com a keystore oficial:

### Gerar Android App Bundle (.aab) - Recomendado Play Store
```bash
cd apps/copas/copadonordeste
flutter build appbundle --release
```
*Saída:* `build/app/outputs/bundle/release/app-release.aab`

### Gerar APK Release (.apk)
```bash
cd apps/copas/copadonordeste
flutter build apk --release
```
*Saída:* `build/app/outputs/flutter-apk/app-release.apk`

---

## 7. Roteiro de Implementação de House Ads (Modelo Paulista)

Para reproduzir no **Copa do Nordeste** a arquitetura de **House Ads** do app Paulista integrada ao PocketBase central de anúncios (`https://zapscore-pocketbase-houseads.gtalg3.easypanel.host`):

### 7.1 No Código Flutter do App (`apps/copas/copadonordeste`)
1. **Adicionar `apiBaseUrl`** em `lib/helpers/app_config.dart`:
   ```dart
   static const String apiBaseUrl = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';
   ```
2. **Adicionar o Serviço `HouseAdService`**:
   - Criar `lib/services/house_ad_service.dart` (baseado no Paulista).
   - O serviço realiza chamadas com timeout defensivo de 2.5s para `${AppConfig.apiBaseUrl}/ads/serve?app=copadonordeste&placement={placement}` e faz o rastreamento automático de impressões (`trackImpression`) e cliques (`trackClickAndLaunch`).
3. **Adicionar os 4 Widgets Especializados em `lib/presentation/widgets/`**:
   - **`house_ad_banner.dart`**: Banner com comportamento híbrido (tenta AdMob primeiro e faz fallback suave para House Ad, ou pode ser configurado com `preferHouseAdFirst: true`).
   - **`house_header_sponsor.dart`**: Faixa de patrocínio no topo da tela de competições (`placement: 'header_sponsor'`).
   - **`house_popup_launch.dart`**: Pop-up modal inteligente na inicialização do aplicativo (`placement: 'popup_launch'`).
   - **`house_native_match_card.dart`**: Card de publicidade intercalado entre os cards de partidas (`placement: 'native_match_card'`).
4. **Vincular nas Telas Principais**:
   - Em `lib/presentation/screens/home/home.dart`: Inicializar o pop-up com `HousePopupLaunchHelper.checkAndShow(context);`.
   - Em `lib/presentation/widgets/competetion.dart`: Inserir `HouseHeaderSponsor(leagueId: 612)` acima das rodadas.
   - Em `lib/presentation/widgets/ad_banner.dart`: Utilizar `HouseAdBanner` como o banner padrão da aplicação.

### 7.2 No Painel PocketBase de House Ads (`zapscore-pocketbase-houseads`)
Na interface administrativa (`https://zapscore-pocketbase-houseads.gtalg3.easypanel.host/_/`):
- Acessar a coleção **`ad_campaigns`**.
- Criar novas campanhas ou vincular existentes preenchendo:
  - **`title`**: Título de identificação interna.
  - **`advertiser`**: Nome do anunciante/parceiro.
  - **`placement`**: Um dos identificadores (`banner_bottom`, `header_sponsor`, `popup_launch` ou `native_match_card`).
  - **`target_apps`**: Adicionar `'copadonordeste'` (ou marcar `'all'` para veiculação global na rede ZapScore).
  - **`creative`**: Imagem/banner criativo (JPG/PNG).
  - **`destination_url`**: Link de destino com UTM tracking para onde o usuário será redirecionado ao clicar.
  - **`status`**: Selecionar `'active'`.

---

## 8. Checklist e Plano de Ação para Produção (Go-Live)

Para deixar o ecossistema 100% operacional para o lançamento na Google Play Store:

### 8.1 Backend PocketBase (`zapscore-pocketbase-copanordeste`)
- [ ] **Criar Usuário Superadmin**: Acessar `/_/` e cadastrar as credenciais de administração.
- [ ] **Importar Schema (`pb_schema.json`)**: Garantir que as coleções padrão (`fixtures`, `standings`, `teams`, `news`, `videos`, `house_ads`, `users`) estejam criadas.
- [ ] **Criar Registro na Coleção `apps`**:
  ```json
  {
    "name": "Copa do Nordeste",
    "app_slug": "copadonordeste",
    "league_id": 612,
    "active": true
  }
  ```
- [ ] **Liberar API Rules**: Verificar se as regras de leitura (List/View) das coleções públicas (`fixtures`, `standings`, `news`, `videos`, `house_ads`) estão sem restrição de token (leitura anônima liberada).
- [ ] **Sincronização Inicial de Jogos**: Rodar o script de carga das tabelas e partidas da liga `612` da API-Football.

### 8.2 Notificações Push & Firebase
- [ ] **Upload da Service Account**: Subir o arquivo `service_account_copadonordeste.json` para o diretório `/pb_hooks/` do container Easypanel ou configurar nas variáveis de ambiente do backend.
- [ ] **Ativar Tópicos FCM**: Certificar-se de que o backend envia pushes para os tópicos `all_copadonordeste` e `match_{id}` nos eventos de gols e início de partidas.

### 8.3 Notícias e Vídeos
- [ ] **Cadastrar Fontes RSS (`news_sources`)**: Adicionar feeds de notícias dedicados à Copa do Nordeste (GE Copa do Nordeste, canais oficiais dos clubes nordestinos) no AdminPanel (`/adminpanel/news/sources`) ou diretamente na coleção `news_sources`.
- [ ] **Validar Agendamento dos Crawlers**: O serviço de crawling da API lerá os feeds cadastrados e populará a coleção `news` sem necessidade de alteração de código.

### 8.4 Integração com AdminPanel Central
- [ ] **Vincular Nova Instância**: No AdminPanel central (`apps/web`), adicionar a URL `https://zapscore-pocketbase-copanordeste.gtalg3.easypanel.host` para monitorar métricas, pushes e conteúdo de forma unificada.
