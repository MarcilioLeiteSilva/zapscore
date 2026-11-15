# Checklist Oficial de Padronização e Atualização de Estaduais (ZapScore)

Este documento estabelece o fluxo de trabalho obrigatório, padronizado e auditado para a atualização de qualquer aplicativo de campeonato estadual do ecossistema ZapScore, tendo como referências os projetos já consolidados (**Baianão**, **Tocantinense** e **Amapaense**).

```mermaid
flowchart TD
    A["1. Coleta e Análise Oficial<br>(Regulamento, Clubes e Tabela)"] --> B["2. Limpeza e Saneamento de Dados<br>(Artilharia, Jogos e Temporada Anterior)"]
    B --> C["3. Estruturação do Normalizador & BracketEngine<br>(Fase Classificatória, Semifinais e Finais)"]
    C --> D["4. Configuração de Clubes & Elencos Canônicos<br>(TeamSquads, IDs da API e Fotos)"]
    D --> E["5. Validação no AdminPanel & Endpoints da API<br>(Filtro por Clube, Notícias/Vídeos e Rascunhos)"]
    E --> F["6. Teste Real no Aparelho Físico<br>(Flutter Run, AdMob Validator e Navegação)"]
    F --> G["7. Deploy Backend & Geração de AAB<br>(Git Push e Build de Release)"]
```

---

## 1. Coleta e Análise do Regulamento e Tabela Oficial
Antes de alterar qualquer linha de código:
- [ ] **Mapeamento de Clubes Participantes**: Identificar todos os clubes confirmados para a temporada 2027 e mapear seus respectivos `teamId` ou `teamExternalId` (API-Football ou banco local).
- [ ] **Formato de Disputa**:
  - Quantidade de clubes na 1ª fase (turno único ou grupos).
  - Número de classificados para mata-mata (ex: semifinais com 4 clubes ou quartas com 8 clubes).
  - Critérios de desempate e vantagens (empate no agregado para o melhor colocado ou disputa de pênaltis).
  - Quantidade de clubes rebaixados para a Série B.
- [ ] **Tabela de Jogos**: Rodadas oficiais, confrontos, datas previstas e horários.

---

## 2. Limpeza e Saneamento da Temporada Anterior
Para evitar que dados históricos de 2026/2025 fiquem misturados na tela inicial ou na tabela:
- [ ] **Saneamento de Artilharia (`Scorer`)**:
  - Verificar se a tela de artilheiros do app ou a home exibe atletas antigos.
  - No `AppConfig.season` do app estadual (ex: `lib/config/app_config.dart`), garantir que o ano da temporada corrente esteja apontado para a temporada ativa (ex: `2027`).
- [ ] **Partidas Anteriores em Loop**:
  - Garantir que o `TeamCubit` e o `FixtureCubit` filtrem apenas partidas da temporada ativa do campeonato e tratem ausência de partidas como estado vazio amigável (`"Nenhum jogo encontrado"` ou `"Em breve"`), sem entrar em loop de requisição.

---

## 3. Motor de Chaves e Mata-Mata (`BracketEngine` & `CompetitionNormalizer`)
- [ ] **Placeholders Limpos para Fases Futuras**:
  - No arquivo `bracket_engine.dart` de cada estadual, nunca preencher equipes antes de partidas serem jogadas na 1ª fase.
  - **Regra de Bloqueio**:
    ```dart
    final hasPlayedMatches = standings.any((st) => st.played > 0);
    ```
  - Se `hasPlayedMatches == false`:
    - Manter `homeTeam: null` e `awayTeam: null`.
    - Definir títulos claros de chave: `1º Colocado x 4º Colocado`, `2º Colocado x 3º Colocado`, `Vencedor Semifinal 1 x Vencedor Semifinal 2`.
- [ ] **Cores e Legendas de Classificação**:
  - No normalizador (`competition_normalizer.dart`), ajustar as legendas e faixas coloridas da tabela:
    - Ex: 1º ao 4º colocados: avanço às semifinais (verde).
    - Ex: 7º e 8º colocados: rebaixamento para a Série B (vermelho).

---

## 4. Cadastro de Clubes, Elencos Canônicos (`TeamSquads`) e Resiliência de Imagens
- [ ] **Escudos Oficiais de Alta Resolução (FAF / oGol)**:
  - Para evitar bloqueios de hotlink da API-Football (`media.api-sports.io`), priorizar os escudos estáveis do oGol (`https://cdn-img.staticzz.com/img/logos/equipas/...`).
  - Esses escudos não sofrem bloqueios por CORS ou anti-scraping da Cloudflare e renderizam instantaneamente no Admin e nos apps Flutter.
- [ ] **Arquivo de Elencos Canônicos no App Flutter**:
  - Criar ou atualizar o arquivo de elencos estaduais (ex: `amapaense_squads.dart`, `tocantinense_squads.dart`).
  - Cadastrar os 8 ou 10 clubes oficiais com jogadores-base (nome, posição, número, idade e URL de foto quando disponível).
- [ ] **Fallback na API Backend (`CompetitionsService` & `TeamsService`)**:
  - Em `apps/api/src/competitions/competitions.service.ts`, registrar `CANONICAL_<ESTADUAL>_CLUBS` e `CANONICAL_<ESTADUAL>_SQUADS`.
  - Assegurar que caso o clube não tenha registro no banco de dados, o backend crie ou devolva os atletas canônicos automaticamente via `getCompetitionPlayers`.
  - Em `apps/api/src/teams/teams.service.ts`: O método `getSquad(teamExternalId)` deve consultar `CompetitionsService.memorySquads` e `CANONICAL_<ESTADUAL>_SQUADS` para que o app mobile receba os elencos e fotos atualizadas em tempo real.

---

## 5. AdminPanel (`apps/web`), Proxy de Imagens e Gestão de Conteúdo
- [ ] **Proxy Obrigatório para Fotos e Escudos (`photoSrc`)**:
  - Nunca usar `<img src={player.photo} />` ou `<img src={player.teamLogo} />` diretamente na tabela do Admin.
  - Encapsular obrigatoriamente através da função `photoSrc(url)`:
    ```typescript
    const photoSrc = (url?: string | null): string => {
      const u = (url || "").trim();
      if (!u) return "";
      if (u.includes("media.api-sports.io")) {
        return `/api/proxy-image?url=${encodeURIComponent(u)}`;
      }
      return u;
    };
    ```
- [ ] **Bypass de Anti-Hotlinking no Proxy Next.js (`apps/web/app/api/proxy-image/route.ts`)**:
  - A rota `/api/proxy-image` deve obrigatoriamente enviar os headers `'Referer': new URL(url).origin` e `'User-Agent': 'Mozilla/5.0...'` para contornar o erro 403 Forbidden da Cloudflare/API-Sports.
  - Implementar fallback resiliente para o proxy central da API ZapScore NestJS (`https://zapscore-zapscore-api.gtalg3.easypanel.host/news/proxy-image?url=...`).
- [ ] **Dropdown de Filtro por Clube**:
  - Na aba de **Jogadores** de `apps/web/app/(main)/adminpanel/estaduais/[id]/page.tsx`, implementar dropdown com a lista de clubes participantes da liga para navegação rápida e sem sobreposição.
- [ ] **CRUD Completo de Atletas**:
  - Inserção de novos jogadores (`POST /competitions/players`).
  - Edição de atleta existente (`PUT /competitions/players/:id`).
  - Exclusão com confirmação (`DELETE /competitions/players/:id`).
- [ ] **Controle de Notícias e Vídeos (Rascunho vs. Publicado)**:
  - Seletor de status (`Publicado` / `Rascunho`) na criação e edição rápida.
  - Filtros de visualização (`Todos`, `Publicados`, `Rascunhos`).
  - Botão de seleção múltipla e **Exclusão em Lote** (`POST /news/bulk-delete`, `POST /videos/bulk-delete`).
  - Preservação da regra máxima de não alterar o schema do Prisma de modo que quebre migrações no PostgreSQL de produção.

---

## 6. Validação e Renderização Segura de Fotos no App Mobile Flutter
- [ ] **Padrão Obrigatório de Renderização de Avatar (`team.dart` e `player.dart`)**:
  - **PROIBIDO** usar `NetworkImage(proxyImage(player.photo!))` com checagem simples de `player.photo != null`. Quando o campo vem com string vazia (`""`), o Dart avalia como não-nulo e quebra a tela com exceção de URI sem host.
  - **Padrão Correto e Resiliente**:
    ```dart
    CircleAvatar(
      radius: 22,
      backgroundColor: context.appColors.info ?? Colors.black26,
      backgroundImage: (player.photo != null && player.photo!.trim().length > 5)
          ? CachedNetworkImageProvider(proxyImage(player.photo!))
          : null,
      child: (player.photo == null || player.photo!.trim().length <= 5)
          ? const Icon(Icons.person, color: Colors.white54)
          : null,
    )
    ```
- [ ] **Execução via ADB / Flutter Run**:
  - Rodar o app no dispositivo conectado (`flutter run -d <DEVICE_ID>`).
- [ ] **Validação AdMob**:
  - Confirmar que o *AdMob Native Ad Validator* exibe zero inconformidades (`"No implementation issues found"`).
  - Verificar se banners e nativos carregam de forma fluida sem vazamentos de memória.
- [ ] **Auditoria de Telas**:
  - **Início**: Sem partidas duplicadas da temporada passada; artilheiros zerados ou corretos.
  - **Tabela**: Classificação com pontos corretos e legenda de vagas/rebaixamento.
  - **Fases de Mata-Mata**: Sem times pré-definidos se a 1ª fase não começou.
  - **Perfil do Clube**: Partidas recentes, tabela, informações institucionais e plantel com atletas e fotos.

---

## 7. Versionamento, Deploy e Build de Produção
- [ ] **Compilação e Auditoria Estática**:
  - `apps/web`: `npx tsc --noEmit` -> 0 erros.
  - `apps/api`: `npx tsc --noEmit` -> 0 erros.
  - `apps/estaduais/<app>`: `flutter analyze` -> 0 erros.
- [ ] **Deploy de Backend / Web**:
  - `git add <arquivos>`
  - `git commit -m "feat(<estadual>): ..."`
  - `git push origin main` (dispara deploy automático no Easypanel).
- [ ] **Build do Pacote para Loja (Google Play)**:
  - Incrementar `version` no `pubspec.yaml` (ex: `version: 1.0.1+2`).
  - Garantir o arquivo `key.properties` configurado apontando para o keystore em `APK/`.
  - Executar: `flutter build appbundle --release`.
  - Copiar o artefato final para o diretório `/<estadual>/APK/` correspondente.

