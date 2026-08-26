# Diretivas de Projeto e Regras de Modificação de Código

## Regra Máxima e Absoluta
- **Edição Estritamente Cirúrgica**: É **PROIBIDO** alterar qualquer arquivo, widget, estilo, padding, cor, fonte ou estrutura que não tenha sido **explicitamente solicitada** pelo usuário.
- **Nenhum Efeito Colateral**: Alterações devem afetar **apenas e tão somente** o elemento ou linha estritamente determinada.
- **Preservação Integral de Layouts**: Preservar 100% dos layouts, contratos de API, widgets e estilos já estabelecidos em todo o projeto.

## Leitura Obrigatória de Contexto e Memória do Ecossistema
- Antes de iniciar qualquer análise, diagnóstico ou edição de código, o agente DEVE consultar obrigatoriamente o arquivo `relatorios/ECOSYSTEM.md`.
- Esse documento contém a topologia completa dos apps, credenciais do Firebase, mapeamento das ligas, funcionamento do backend PocketBase, o AdminPanel e regras de negócio de notificações push.
- **Verificação de Tarefas Pendentes `[A FAZER]`:** O agente DEVE verificar as seções marcadas com a tag `[A FAZER]` no `ECOSYSTEM.md` (como o *Capítulo 10: Server-Side FCM Topics*) e, no início da conversa, perguntar proativamente ao usuário se deseja prosseguir com a implementação da funcionalidade pendente.

## Proibição Absoluta de Alteração no Código dos Crawlers
- **Imutabilidade dos Motores de Crawling**: É **EXPRESSAMENTE PROIBIDO** alterar o código-fonte dos crawlers de notícias e vídeos (`apps/api/src/news/news-crawler.service.ts` e `apps/api/src/videos/video-crawler.service.ts`), bem como a lógica de extração e tratamento de imagens.
- **Expansão via Feeds e Fontes RSS**: O abastecimento e expansão de conteúdos para novas ligas, estaduais ou copas deve ser realizado **EXCLUSIVAMENTE** através da inserção e gestão de URLs de RSS/Feeds pela interface do AdminPanel (`/adminpanel/news/sources`) ou via endpoint de `news-sources`.
