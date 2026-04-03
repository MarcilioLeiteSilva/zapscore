# ZapScore API

A base da plataforma de inteligência esportiva ZapScore.

## 🚀 Status Inicial
Este repositório contém a infraestrutura básica e a API funcional para a fase 1 do projeto.

---

## 🏗️ Estrutura do Projeto
O projeto utiliza um padrão de monorepo (ou pronto para ser um) com a seguinte estrutura:

- `apps/api`: NestJS API com endpoints de health, version e root.
- `package.json` (raiz): Scripts globais para gerenciar os apps.

---

## 🛠️ Como rodar localmente

### Pré-requisitos
- Node.js 20+
- npm

### Passos
1. Clone o repositório.
2. No diretório raiz, instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` baseado no `.env.example` dentro de `apps/api`:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
4. Inicie a API em modo de desenvolvimento:
   ```bash
   npm run api:dev
   ```
5. Acesse: `http://localhost:3000`

---

## 🚢 Deploy no EasyPanel

Para configurar o deploy na sua VPS utilizando o EasyPanel:

### 1. Criar o App na EasyPanel
- Vá ao seu painel EasyPanel.
- Clique em **Projects** e selecione (ou crie) o projeto **ZapScore**.
- Clique em **Create Service** > **App**.
- Nome: `api-zapscore`

### 2. Conectar ao GitHub
- No campo **Source**, selecione **GitHub**.
- Conecte sua conta e selecie o repositório `zapscore`.
- **Branch**: `main` (ou a que você estiver usando).
- **Subdiretório**: `apps/api` (Importante!).

### 3. Configurar Build
- O EasyPanel deve detectar automaticamente o `Dockerfile` dentro da pasta `apps/api`.
- Certifique-se de que o **Build Method** seja `Docker`.

### 4. Variáveis de Ambiente
Na aba **Environment**, adicione:
- `PORT`: `3000`
- `NODE_ENV`: `production`
- `APP_NAME`: `ZapScore API`
- `APP_VERSION`: `1.0.0`

### 5. Configurar Domínio e SSL
- Na aba **Domains**, adicione: `api.zapscore.com.br`.
- Habilite o SSL/HTTPS (geralmente automático no EasyPanel com Let's Encrypt).

---

## 🌐 DNS e Apontamento
Para que o domínio `api.zapscore.com.br` funcione:

1. Acesse o gerenciador de DNS do seu domínio (Cloudflare, Registro.br, etc).
2. Adicione um registro do tipo **A**:
   - **Nome (Host)**: `api`
   - **Conteúdo (IP)**: `IP_DA_SUA_VPS`
3. Ou, se preferir usar CNAME (caso tenha um record principal):
   - **Nome**: `api`
   - **Conteúdo**: `seu-servidor.com`

---

## 📡 Endpoints Disponíveis
- `GET /` - Informações básicas da API.
- `GET /health` - Status de saúde do serviço.
- `GET /version` - Detalhes da versão e ambiente.

---

## ✅ Checklist de Validação
- [ ] API sobe localmente (`npm run api:dev`)
- [ ] Build do container funciona (`docker build -t zapscore-api ./apps/api`)
- [ ] Endpoints respondem 200: `/`, `/health`, `/version`
- [ ] Domínio `api.zapscore.com.br` aponta para o IP correto
- [ ] SSL ativo no domínio da API
