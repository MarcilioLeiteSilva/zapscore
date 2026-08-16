# Relatório de Status do Layout: Detalhes da Partida (ZapScore Europa)
**Data:** 02 de Agosto de 2026  
**Status:** Concluído / Estável

---

## 1. Visão Geral
Este documento especifica o estado final do mapeamento e regras de design aplicadas cirurgicamente à tela de **Detalhes da Partida** (`fixt_details.dart`) e suas abas dependentes na aplicação ZapScore.

---

## 2. Card Superior e Cabeçalho Principal (`fixt_details.dart` & `fixture.dart`)
- **Card Superior de Placar (`CardFixtureDetail`)**:
  - Cor de Fundo: `#454444` (`const Color(0xFF454444)`).
  - Tipografia: Fonte **Urbanist** (`GoogleFonts.urbanist`).
  - Margem Superior (`Gap` antes do card): **100px** (`Gap(100)`).
- **Barra de Título (`SliverAppBar`)**:
  - Cor de Fundo: `AppColor.background` (`backgroundColor: AppColor.background`).
  - Surface Tint Color: `Colors.transparent` (elimina transparência indesejada ao rolar o conteúdo).
  - Remoção de Padding Automático: Envolvido em `MediaQuery.removePadding(removeTop: true)`.

---

## 3. Menu de Pílulas de Navegação (`CardCheepTabSearch`)
- **Container do Menu**:
  - Altura Fixa: `45px`.
  - Margens Laterais: **10px** nas extremidades com mascaramento/corte (`ClipRect` + `Padding(horizontal: 10)`), garantindo que as pílulas rolem por baixo das margens laterais.
  - Padding Vertical Interno: `12px`.
- **Estilo das Pílulas**:
  - Cor do Card Selecionado: `#454444`.
  - Fonte Selecionada: **Branca** (`Colors.white`), `FontWeight.bold`, Tamanho `12px`.
  - Fonte Não Selecionada: **Preta** (`Colors.black`), `FontWeight.normal`, Tamanho `12px`.

---

## 4. Mapeamento por Aba

### 4.1. Aba Info (`info.dart`)
- **Padding da Lista**: `left: 10px`, `right: 10px`, `top: 0px`, `bottom: 20px`.
- **Card Básico de Informações (`CardBasicInfo`)**:
  - Cor de Fundo: `#454444`.
  - Tipografia: Fonte **Urbanist** (`GoogleFonts.urbanist`).
- **Alterações Específicas**: Seção "Form" e `CardFormInfoFixture` eliminados conforme solicitação.

### 4.2. Aba Resumo (`summary.dart`)
- **Padding da Lista**: `left: 10px`, `right: 10px`, `top: 0px`, `bottom: 20px`.
- **Cartões de Eventos e Posse de Bola (`CardEventMatch`, `CardEventPossession`)**:
  - Fonte: **Urbanist** (`GoogleFonts.urbanist`).

### 4.3. Aba Análise da IA (`ai_analysis.dart`)
- **Padding da Lista**: `left: 10px`, `right: 10px`, `top: 0px`, `bottom: 20px`.
- **Espaçamento entre Cards/Seções**: Reajustado rigorosamente para **12px** (`Gap(12)`).
- **Tipografia**: Mantida no padrão original (preservando legibilidade para textos longos).

### 4.4. Aba Estatísticas (`stats.dart`)
- **Padding da Lista**: `left: 10px`, `right: 10px`, `top: 12px`, `bottom: 20px`.
- **Tipografia dos Rótulos e Valores**: Fonte **Urbanist** (`GoogleFonts.urbanist`).

### 4.5. Aba Escalações (`lienups.dart`)
- **Padding da Lista**: `left: 10px`, `right: 10px`, `top: 12px`, `bottom: 20px`.
- **Cor dos Cartões (`CardSubstitution`, `CardSubstitutionPlayers`, `CardLineup` fallback)**: `#454444`.

### 4.6. Aba Tabela (`table.dart`)
- **Padding da Lista**: `left: 10px`, `right: 10px`, `top: 12px`, `bottom: 20px`.
- **Cor do Card da Tabela**: `#454444`.
- **Tipografia das Linhas e Nomes de Times**: Fonte **Urbanist** (`GoogleFonts.urbanist`).

### 4.7. Aba Relato (`report.dart` & `news.dart`)
- **Padding da Lista**: `left: 10px`, `right: 10px`, `top: 6px`, `bottom: 20px`.
- **Separador entre Notícias**: **6px** (`Gap(6)`).
- **Tipografia das Notícias (`CardNewsItem`)**: Fonte **Urbanist** (`GoogleFonts.urbanist`).

### 4.8. Aba H2H / Confrontos Diretos (`h2h.dart`)
- **Padding da Lista**: `left: 10px`, `right: 10px`, `top: 12px`, `bottom: 20px`.
- **Tipografia dos Cartões (`CardOverallLastFive`)**: Fonte **Urbanist** (`GoogleFonts.urbanist`).

---

## 5. Resumo das Regras Aplicadas
- **Cor dos Cards**: `#454444` em todas as seções solicitadas.
- **Tipografia Padrão**: **Urbanist** (`GoogleFonts.urbanist`) em rótulos, botões, dados e cards (exceto corpo extenso da IA).
- **Edição Cirúrgica**: 100% dos contratos de API, widgets circundantes e comportamentos de Cubits foram preservados sem efeitos colaterais.
