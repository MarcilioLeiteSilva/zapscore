# Plano de Implementação: Central de Comando & Controle Multi-Ecossistema ZapScore (`adminpanel`)

**Data:** 02 de Agosto de 2026  
**Foco Atual:** **Etapa 1 - Reformulação Completa do Layout (UI/UX)**  
**Escopo:** Aplicação Web ZapScore (`d:\zapscore\apps\web\app\(main)\adminpanel`)  
**Diretório de Trabalho:** `d:\zapscore\apps\web\app\(main)\adminpanel`  
**Autor:** Equipe de Arquitetura & Desenvolvimento Web ZapScore  

---

## 1. Objetivo Imediato
Estabelecer a **Etapa 1 (Reformulação do Layout & Registro de Módulos)** como a base visual e estrutural do novo `adminpanel`. O foco é criar um menu lateral inteligente, categorizado e modular, além de uma barra de navegação no topo com indicação visual de links ativos e atalhos para todos os ecossistemas da plataforma ZapScore (*Europa, Brasil & Estaduais, Copas, Conteúdo Global, Sentinela*).

---

## 2. Estrutura de Arquivos da Etapa 1 (`adminpanel`)

```
d:\zapscore\apps\web\app\(main)\adminpanel\
├── layout.tsx                      # Layout Principal com Menu Lateral Categorizado & Topbar
├── registry.ts                     # Registro Central dos Ecossistemas (Europa, Brasil, Copas, etc.)
├── components/                     # Componentes Visuais do Layout
│   ├── AdminSidebar.tsx            # Menu Lateral Modular Categorizado
│   ├── AdminHeader.tsx             # Barra Superior de Status & Perfil/Navegação
│   └── ActiveLink.tsx              # Componente com Destaque Visual do Link Ativo
└── page.tsx                        # Dashboard Principal Reformulado com Visualização dos Módulos
```

---

## 3. Detalhamento da Etapa 1: Reformulação do Layout (EM ANDAMENTO)

### 🎨 **Requisito 1.1: Registro Central dos Módulos (`registry.ts`)**
Criar o catálogo estático dos ecossistemas para alimentar o menu lateral e os seletores do painel:
- 🇪🇺 **Europa**: Bundesliga, La Liga, Premier League, Ligue 1, Serie A Itália (*PocketBase*).
- 🇧🇷 **Brasil & Estaduais**: Brasileirão Série A, Paulistão, Cariocão (*Supabase*).
- 🏆 **Copas & Torneios**: Libertadores, Champions League, Copa do Brasil.
- 📰 **Conteúdo Global**: Notícias, Fontes RSS, Vídeos.
- 🛡️ **Sentinela & Serviços**: Monitor de Saúde da Infraestrutura.

### 🎨 **Requisito 1.2: Menu Lateral Categorizado (`AdminSidebar.tsx`)**
Substituir a lista única de links por seções agrupadas com títulos em caixa alta e ícones distintivos:
- 📊 **VISÃO GERAL** (*Dashboard, Sentinela*)
- 🇪🇺 **MÓDULO EUROPA** (*Suíte Europa - PocketBase*)
- 🇧🇷 **MÓDULO BRASIL & ESTADUAIS** (*Supabase*)
- 🏆 **COPAS & TORNEIOS**
- 📰 **CONTEÚDO GLOBAL** (*Notícias, Fontes, Vídeos*)

### 🎨 **Requisito 1.3: Destaque Visual do Link Ativo (`ActiveLink.tsx`)**
- Identificar dinamicamente a rota atual via `usePathname()`.
- Aplicar destaque elegante ao item ativo (`bg-orange-500/10 text-orange-400 border-l-4 border-orange-500 font-bold`).

### 🎨 **Requisito 1.4: Barra Superior de Status & Atalhos (`AdminHeader.tsx`)**
- Exibir migalha de pão (*Breadcrumb*) informando o módulo atual.
- Exibir indicadores de status de conexão (*PocketBase Online, API Online*).
- Atalho rápido para voltar ao site e botão de Logout.

---

## 4. Próximas Etapas (Reformuladas e Dependente do Layout)

### 📍 Etapa 2: Conectores & Hub do Módulo Europa (`adminpanel/europa`)
Após o layout aprovado, construir a página do Hub Europa integrando as ligas europeias ao menu recém-criado.

### 📍 Etapa 3: Modais Universais de Ação Rápida (`components/`)
Adicionar modais de ajuste de placar, injeção de vídeo, notícias e artilharia acionados a partir do layout.

### 📍 Etapa 4: Módulo Brasil & Estaduais (`adminpanel/brasil`)
Expandir o layout recém-criado para cobrir o ecossistema do Futebol Brasileiro (Supabase).

### 📍 Etapa 5: Serviços, Agentes e Homologação Final
Ativação dos agentes de automação dentro de `adminpanel/services` e testes operacionais.
