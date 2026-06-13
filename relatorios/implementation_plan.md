# Plano de Implementação de Segurança - ZapScore

Este documento descreve as ações planejadas para implementar camadas de segurança críticas no backend (NestJS) e no frontend (Next.js) do ZapScore.

## User Review Required

> [!WARNING]
> A ativação do `ApiKeyGuard` no backend exigirá que todas as requisições manuais ou scripts de bootstrap passem a incluir o cabeçalho `x-api-key`.

> [!IMPORTANT]
> A implementação da proteção de rotas no Next.js (`/adminpanel`) exigirá o login ou a configuração da passkey no navegador (salva em cookie).

## Decisões Tomadas com o Usuário
1. **Mecanismo de Login:** Adotaremos a passkey mestre (senha configurada via variável de ambiente `ADMIN_PASSKEY` e salva em cookie) para o painel administrativo de forma simplificada e direta.
2. **Devalidação do `apps/admin`:** O diretório `apps/admin` será **completamente removido/deletado** do monorepo, centralizando todo o painel de gerenciamento em `apps/web/app/(main)/adminpanel`.

---

## Proposed Changes

### [Backend - NestJS API]

A API do NestJS receberá as seguintes melhorias de segurança:

#### [NEW] [api-key.guard.ts](file:///d:/zapscore/apps/api/src/common/guards/api-key.guard.ts)
- Criação de um Guard do NestJS para verificar o cabeçalho `x-api-key`.
- O valor correto do token será carregado a partir da variável de ambiente `ADMIN_API_KEY`.

#### [MODIFY] [sync.controller.ts](file:///d:/zapscore/apps/api/src/sync/sync.controller.ts)
- Aplicação do `@UseGuards(ApiKeyGuard)` a nível de classe, para que todas as rotas de sincronização de dados (`/sync/*`) passem a exigir autenticação.

#### [MODIFY] [main.ts](file:///d:/zapscore/apps/api/src/main.ts)
- Instalação e ativação do `helmet` para configurar cabeçalhos de segurança padrão contra ataques XSS, Clickjacking, etc.
- Configuração dinâmica do CORS: ler as origens permitidas a partir da variável de ambiente `CORS_ALLOWED_ORIGINS` (ex: `https://zapscore.com`), mantendo um fallback local seguro (`http://localhost:3000` / `http://localhost:3001`).
- Ativação do `ValidationPipe` global do NestJS (`app.useGlobalPipes(new ValidationPipe({ whitelist: true }))`).

#### [MODIFY] [app.module.ts](file:///d:/zapscore/apps/api/src/app.module.ts)
- Instalação do pacote `@nestjs/throttler`.
- Configuração global do `ThrottlerModule` para limitar requisições (por exemplo, máximo de 100 requisições a cada 1 minuto por IP).

---

### [Frontend - Next.js Web App]

O painel administrativo integrado receberá proteção de rotas:

#### [NEW] [middleware.ts](file:///d:/zapscore/apps/web/middleware.ts)
- Criação de um middleware Next.js que interceptará requisições para a rota `/adminpanel/:path*`.
- Verificará a existência de um cookie (`zapscore_admin_token`) que corresponda à passkey mestre.
- Redirecionará requisições não autorizadas para a tela de login administrativo (`/admin/login`).

#### [NEW] [page.tsx](file:///d:/zapscore/apps/web/app/admin/login/page.tsx)
- Criação de uma interface visual premium (seguindo a identidade visual moderna, escura e com detalhes em degradê do ZapScore) para a tela de login.
- O usuário inserirá a passkey administrativa. Se correta, um cookie é gravado e o usuário é redirecionado ao `/adminpanel`.

#### [MODIFY] [api-client.ts](file:///d:/zapscore/apps/web/lib/api-client.ts)
- Ajustar as requisições de métodos administrativos (ou todas as que interagem com `/sync`) para enviar o header `x-api-key` contendo a chave de administração do backend.

---

### [Remoção / Depreciação]

#### [DELETE] [apps/admin](file:///d:/zapscore/apps/admin)
- Remoção completa da pasta contendo o aplicativo administrativo secundário depreciado.

---

## Verification Plan

### Automated Tests
- Execução de testes manuais com comandos `curl` ou scripts de teste do tipo:
  - `curl -X POST http://localhost:3000/sync/today` (deve retornar `401 Unauthorized`).
  - `curl -H "x-api-key: <chave_correta>" -X POST http://localhost:3000/sync/today` (deve retornar `201 Created` / `200 OK`).
  - Chamadas repetitivas de requisições rápidas para testar o rate limiter (`429 Too Many Requests`).

### Manual Verification
- Acesso à rota `/adminpanel` no navegador: deve redirecionar automaticamente para `/admin/login`.
- Login com senha incorreta: deve exibir erro estilizado de credenciais.
- Login com a passkey mestre correta: deve autenticar com sucesso, criar o cookie e redirecionar para o painel.
- O painel deve continuar sendo capaz de realizar as sincronizações manuais enviando a API Key nos cabeçalhos HTTP.
