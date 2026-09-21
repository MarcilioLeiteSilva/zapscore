import { EcosystemApp } from './apps-catalog';
import { ASOPayload } from './aso-generator';
import { StoreDeclarationsPayload, getPlayConsoleFormChecklist } from './store-forms';
import { generateVisualAssetsSpecs } from './canva-service';

export interface ExportPackageData {
  appId: string;
  packageName: string;
  appName: string;
  generatedAt: string;
  files: {
    filename: string;
    description: string;
    mimeType: string;
    content: string;
  }[];
}

export function generateExportPackage(
  app: EcosystemApp,
  aso: ASOPayload,
  declarations: StoreDeclarationsPayload
): ExportPackageData {
  const checklist = getPlayConsoleFormChecklist(app.id);
  const visualAssets = generateVisualAssetsSpecs(app);

  // 1. Arquivo de ASO pt-BR
  const asoContent = `================================================================================
FICHA DA LOJA GOOGLE PLAY - ${app.name.toUpperCase()} (${app.packageName})
================================================================================

[1] TÍTULO DO APLICATIVO (Máx: 30 caracteres)
--------------------------------------------------------------------------------
${aso.title}
(Contagem atual: ${aso.title.length}/30 caracteres)


[2] BREVE DESCRIÇÃO (Máx: 80 caracteres)
--------------------------------------------------------------------------------
${aso.shortDescription}
(Contagem atual: ${aso.shortDescription.length}/80 caracteres)


[3] DESCRIÇÃO COMPLETA (Máx: 4.000 caracteres)
--------------------------------------------------------------------------------
${aso.fullDescription}


[4] NOTAS DA VERSÃO / O QUE HÁ DE NOVO (Máx: 500 caracteres)
--------------------------------------------------------------------------------
${aso.releaseNotes}


[5] PALAVRAS-CHAVE SUGERIDAS (ASO)
--------------------------------------------------------------------------------
${aso.keywords.join(', ')}
`;

  // 2. Guia de Preenchimento Manual dos Formulários no Play Console
  const checklistMarkdown = `# Guia de Preenchimento Manual - Google Play Console
**Aplicativo:** ${app.name}  
**Pacote Android:** \`${app.packageName}\`  
**Gerado em:** ${new Date().toLocaleString('pt-BR')}

---

## 1. Conteúdo do App > Público-Alvo e Conteúdo
- **Faixas etárias selecionadas:** Marcar estritamente **16 a 17 anos** E **18 anos ou mais (16+)**.
- **O app tem atração não intencional para crianças?** Marcar **NÃO**.
- *Nota de conformidade:* A escolha da faixa 16+ isenta o app da rigorosa Política de Famílias do Google Play e da lei COPPA, autorizando a monetização via Google AdMob e notificações push sem bloqueios de privacidade infantil.

---

## 2. Configurações da Loja > Categoria
- **Tipo de aplicativo:** Aplicativo
- **Categoria Primária:** **Esportes (SPORTS)**
- **Categoria Secundária / Tag:** **Entretenimento (ENTERTAINMENT)**
- **Tags adicionais:** Futebol, Placar ao Vivo, Estatísticas esportivas, Notícias de esportes.

---

## 3. Conteúdo do App > Declaração de Anúncios
- **O aplicativo contém anúncios?** Marcar **SIM, meu app contém anúncios**.
- **Rede utilizada:** Google AdMob (Banners, Intersticiais e Abertura).

---

## 4. Conteúdo do App > Acesso a Recursos
- **Acesso ao aplicativo:** Marcar **Todas as funcionalidades estão disponíveis sem restrições de login**.
- O app não exige usuário/senha ou assinatura para consulta de placar, escalações e tabelas.

---

## 5. Conteúdo do App > Segurança dos Dados (Data Safety)
### Coleta de Dados:
1. **Identificadores de Dispositivo (Device or other IDs):**
   - Coletado? **SIM**
   - Finalidade: **Funcionalidade do app (Tokens FCM para Notificações Push de Gols)**.
   - Vinculado ao usuário? **NÃO**.
   - É efêmero? **SIM**.
2. **Localização Aproximada (Coarse Location):**
   - Coletado? **SIM**
   - Finalidade: **Publicidade e Marketing (AdMob)**.
   - Vinculado ao usuário? **NÃO**.
   - Opcional? **SIM**.

### Práticas de Segurança:
- Os dados são transmitidos por conexão segura e criptografada? **SIM (HTTPS / TLS 1.3)**.
- Você oferece um mecanismo para exclusão de dados? **SIM (Desativação de notificações no app ou desinstalação)**.
- URL da Política de Privacidade: \`${app.privacyPolicyUrl}\`

---

## 6. Classificação Indicativa (IARC)
- Responder ao questionário de esportes/notícias.
- Não há violência, nudez, drogas, jogos de azar com dinheiro real ou chat entre usuários.
- Classificação resultante estimada: **Livre / Everyone (PEGI 3, USK 0)**.
`;

  // 3. Guia de Assets no Canva Pro
  const canvaMarkdown = `# Guia de Assets Visuais no Canva Pro
**Aplicativo:** ${app.name}  
**Identidade Visual:** Primária \`${app.primaryColor}\` | Secundária \`${app.secondaryColor}\` | Destaque \`${app.accentColor}\`

### Links Diretos de Criação com Dimensões Exatas:
${visualAssets.assets.map((asset) => `- **${asset.title}** (${asset.width}x${asset.height} px): [Criar no Canva](${asset.canvaTemplateUrl})
  - *Headline:* "${asset.copyHeadline}"
  - *Subtítulo:* "${asset.copySubtitle}"`).join('\n')}
`;

  return {
    appId: app.id,
    packageName: app.packageName,
    appName: app.name,
    generatedAt: new Date().toISOString(),
    files: [
      {
        filename: `ASO_${app.id}_pt_BR.txt`,
        description: 'Textos oficiais de ASO (Título 30c, Breve 80c, Descrição 4000c e Novidades 500c)',
        mimeType: 'text/plain',
        content: asoContent
      },
      {
        filename: `FORMULARIOS_GOOGLE_PLAY_${app.id}.md`,
        description: 'Checklist passo a passo para preenchimento manual de formulários da loja',
        mimeType: 'text/markdown',
        content: checklistMarkdown
      },
      {
        filename: `store_declarations_${app.id}.json`,
        description: 'Payload estruturado de declarações da loja em JSON',
        mimeType: 'application/json',
        content: JSON.stringify(declarations, null, 2)
      },
      {
        filename: `CANVA_ASSETS_GUIDE_${app.id}.md`,
        description: 'Guia de links do Canva Pro e copies comerciais dos mockups',
        mimeType: 'text/markdown',
        content: canvaMarkdown
      }
    ]
  };
}
