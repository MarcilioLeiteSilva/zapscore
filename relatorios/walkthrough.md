# Walkthrough - Implementação de Segurança no ZapScore

Todas as ações descritas no plano de segurança foram implementadas com sucesso e as duas aplicações do monorepo (`api` e `web`) foram compiladas sem erros.

## Mudanças Realizadas

### 1. Limpeza do Monorepo
* **Remoção de Código Depreciado:** O diretório `apps/admin` foi completamente removido do monorepo, unificando toda a lógica e controle do painel de administração na aplicação principal `apps/web`.

### 2. Backend (NestJS API)
* **API Key Guard:** Criado o guard [api-key.guard.ts](file:///d:/zapscore/apps/api/src/common/guards/api-key.guard.ts) para bloquear todas as rotas do [sync.controller.ts](file:///d:/zapscore/apps/api/src/sync/sync.controller.ts) que não forneçam o header `x-api-key` válido (configurado por `ADMIN_API_KEY` nas variáveis de ambiente).
* **Rate Limiting:** Configurado o `ThrottlerModule` no [app.module.ts](file:///d:/zapscore/apps/api/src/app.module.ts) com limite de 100 requisições por minuto por IP para evitar ataques de DoS e spam.
* **Cabeçalhos de Segurança:** Adicionado o middleware `helmet` no [main.ts](file:///d:/zapscore/apps/api/src/main.ts) para proteger o servidor contra vulnerabilidades HTTP comuns.
* **CORS Restrito:** O CORS em [main.ts](file:///d:/zapscore/apps/api/src/main.ts) agora aceita origens específicas definidas em `CORS_ALLOWED_ORIGINS` (cujo fallback de desenvolvimento local está definido como liberado em `.env`).
* **Validação de Payload:** Ativado o `ValidationPipe` global no NestJS.

### 3. Frontend (Next.js apps/web)
* **Middleware de Proteção de Rotas:** Criado o [middleware.ts](file:///d:/zapscore/apps/web/middleware.ts) para impedir o acesso às rotas sob `/adminpanel/*` se o cookie de sessão `zapscore_admin_token` não corresponder à passkey configurada na variável `ADMIN_PASSKEY`.
* **Login Seguro:** Criada uma página de login moderna [page.tsx](file:///d:/zapscore/apps/web/app/admin/login/page.tsx) e o endpoint de login [route.ts](file:///d:/zapscore/apps/web/app/api/admin/login/route.ts) que valida a passkey no servidor de forma segura e injeta o cookie como `HttpOnly` (prevenindo roubo de token por XSS no cliente).
* **Encaminhamento da API Key:** O cliente da API [api-client.ts](file:///d:/zapscore/apps/web/lib/api-client.ts) foi aprimorado para injetar o header `x-api-key` automaticamente quando executado no servidor.

---

## Resultados dos Testes

1. **Compilação do Backend:**
   * Executado `npm run build` no `apps/api`.
   * **Resultado:** Compilou com sucesso sem erros.

2. **Compilação do Frontend:**
   * Executado `npm run build` no `apps/web`.
   * **Resultado:** Compilou com sucesso com Next.js Turbopack, gerando estaticamente a tela de login (`/admin/login`) e o middleware de segurança (`Proxy`).
