# ZapScore API

API backend oficial da plataforma de inteligência esportiva ZapScore (Foco inicial: Futebol).

Nesta **Fase 2 (Atualizada)**, o app evoluiu para seu escopo absoluto orientando as rotinas e integrações exclusivamente para os recursos vitais e dados autênticos voltados para: **League: 71 (Brasileirão), Season: 2026**.

## 🛠 Stack Tecnológica
- **Linguagem**: TypeScript
- **Framework**: NestJS
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL (No EasyPanel)
- **Cache/Background**: Redis (No EasyPanel)
- **Containerização**: Docker (Multi-stage build)

---

## 🚢 Deploy no EasyPanel (Ambiente Principal)

O ambiente produtivo reside primariamente no painel de administração (EasyPanel) gerindo três entidades:
1. **api** (o container gerado deste repositório NodeJS congelado para build sem manipulações perigosas)
2. **postgres** (serviço relacional de banco persistido)
3. **redis** (serviço provedor do runtime state e buffer)

### Passos da Implantação e Servidor

**1. Verifique os Serviços Postgres e Redis**
Confirme através do EasyPanel Dashboard que ambos os utilitários estão com volume ativado, portas listadas e running sem crashes na interface de log. 

**2. Configure as Variáveis de Ambiente do app API**
A API dependerá integralmente que o EasyPanel transmita esses valores em _"Environment"_ form:
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST_INTERNO_POSTGRES:5432/zapscore
REDIS_URL=redis://HOST_INTERNO_REDIS:6379
API_FOOTBALL_KEY=sua_chave_secreta_aqui
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
DEFAULT_LEAGUE_ID=71
DEFAULT_SEASON=2026
```

**3. Executar Migrations em Produção**
Através do terminal web (ou deploy command) gerado diretamente no contêiner web da API:
```bash
npx prisma migrate deploy
```
*(O banco PostgreSQL no EasyPanel será modelado com League, Team, Fixtures e Standings com isso).*

---

## 🔄 Sync Data (Brasileirão 2026)

Mecanismos que populam os dados oficiais consumindo a API-Football convertendo em nossos modelos internos. Eles ativam sob a regra imútável da `DEFAULT_LEAGUE_ID` e `DEFAULT_SEASON`.

**Rotas POST (Disparos):**
- `POST /sync/bootstrap` : O construtor total. Puxa em fila a Liga 71 em 2026, popula a tabela dos clássicos 20 times (Teams), varre todas as `fixtures` e insere sequêncialmente a tabela final de classificação `standings`.
- `POST /sync/leagues/71` : Traciona somente a info global desta liga p/ o banco.
- `POST /sync/teams` : Traciona times locais.
- `POST /sync/fixtures` : Sincroniza matriz do campeonato sem query explícita.
- `POST /sync/standings` : Importa a classificação pura e atualiza.

---

## 📡 Endpoints Públicos Principais

Consumo REST puro a partir do Postgres interno. Nunca reespalham load para a API externa:

- `GET /leagues` - Listagem de ligas monitoradas (Brasileirão focado).
- `GET /teams` - Listagem com detalhes de times que estão persistidos.
- `GET /fixtures/today` - Tabela de partidas de hoje e parciais.
- `GET /standings?league=71&season=2026` - Pontuações ordenadas, wins, loses e empates lidas unicamente via ORM local.
- `GET /health` e `GET /version` - Up metrics.
