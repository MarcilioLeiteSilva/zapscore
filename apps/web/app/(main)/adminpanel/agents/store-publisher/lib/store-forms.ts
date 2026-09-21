import { EcosystemApp, getAppById } from './apps-catalog';

export interface StoreDeclarationsPayload {
  appId: string;
  packageName: string;
  generatedAt: string;

  // 1. Público-Alvo e Conteúdo (Target Audience & Content)
  targetAudience: {
    targetAgeGroups: ('16-17' | '18+')[];
    minAge: 16;
    isDirectedToChildren: false;
    unintentionalAppealToChildren: false;
    avoidFamiliesPolicyReason: string;
    summary: string;
  };

  // 2. Categorização da Loja (Store Categorization)
  categorization: {
    appType: 'APPLICATION';
    primaryCategory: 'SPORTS';
    primaryCategoryLabel: string;
    secondaryCategoryOrTag: 'ENTERTAINMENT';
    secondaryCategoryLabel: string;
    additionalTags: string[];
    summary: string;
  };

  // 3. Política de Anúncios (Ads Policy)
  adsDeclaration: {
    containsAds: true;
    adNetworks: string[];
    adFormats: string[];
    summary: string;
  };

  // 4. Classificação Indicativa IARC (Content Rating)
  iarcRating: {
    category: 'Sports / Entertainment';
    violence: 'None';
    sexuality: 'None';
    profanity: 'None';
    controlledSubstances: 'None';
    gambling: 'None';
    userInteractions: 'None (Scores & Notifications broadcast)';
    estimatedRating: {
      brazilDJCTQ: 'Livre';
      pegi: 'PEGI 3';
      esrb: 'Everyone';
      usk: 'USK 0';
    };
    summary: string;
  };

  // 5. Segurança dos Dados (Data Safety Form)
  dataSafety: {
    dataCollected: {
      type: string;
      category: string;
      purposes: string[];
      isOptional: boolean;
      isEphemeral: boolean;
      isLinkedToUser: boolean;
      usedForTracking: boolean;
    }[];
    securityPractices: {
      dataEncryptedInTransit: true;
      encryptionStandard: 'HTTPS / TLS 1.3';
      canRequestDataDeletion: true;
      dataDeletionMechanism: string;
      followsFamilyPolicy: false; // 16+ não requer
    };
    privacyPolicyUrl: string;
    summary: string;
  };

  // 6. Acesso ao Aplicativo (App Access)
  appAccess: {
    accessType: 'ALL_FUNCTIONALITY_AVAILABLE';
    requiresLoginOrSubscription: false;
    instructions: string;
  };

  // 7. Declarações Complementares da Google Play
  additionalDeclarations: {
    isGovernmentApp: false;
    isFinancialApp: false;
    isHealthOrCovidApp: false;
    isNewsApp: true;
    newsDisclosure: string;
  };
}

export function generateStoreDeclarations(app: EcosystemApp): StoreDeclarationsPayload {
  return {
    appId: app.id,
    packageName: app.packageName,
    generatedAt: new Date().toISOString(),

    // 1. Público-Alvo: Rigorosamente 16+ para evitar restrições da Política de Famílias / COPPA
    targetAudience: {
      targetAgeGroups: ['16-17', '18+'],
      minAge: 16,
      isDirectedToChildren: false,
      unintentionalAppealToChildren: false,
      avoidFamiliesPolicyReason: 
        'Declarado explicitamente para 16 anos ou mais (16-17 e 18+). Isenta o app da rigorosa Política para Famílias do Google Play e conformidade COPPA, viabilizando monetização normal com AdMob e notificações sem bloqueios de público infantil.',
      summary: 'Público-Alvo: 16+ (16-17, 18+). Livre de exigências de Família/COPPA.'
    },

    // 2. Categorias: Primária ESPORTES (SPORTS) + Secundária/Tag ENTRETENIMENTO (ENTERTAINMENT)
    categorization: {
      appType: 'APPLICATION',
      primaryCategory: 'SPORTS',
      primaryCategoryLabel: 'Esportes (SPORTS)',
      secondaryCategoryOrTag: 'ENTERTAINMENT',
      secondaryCategoryLabel: 'Entretenimento (ENTERTAINMENT)',
      additionalTags: [
        'Futebol',
        'Placar ao vivo',
        'Estatísticas esportivas',
        'Notícias esportivas',
        'Tabela de classificação'
      ],
      summary: 'Categoria Primária: SPORTS | Categoria Secundária/Tag: ENTERTAINMENT'
    },

    // 3. Anúncios
    adsDeclaration: {
      containsAds: true,
      adNetworks: ['Google AdMob'],
      adFormats: ['Banner adaptativo', 'Intersticial', 'App Open Ads'],
      summary: 'Sim, contém anúncios (Google AdMob SDK integrado).'
    },

    // 4. IARC
    iarcRating: {
      category: 'Sports / Entertainment',
      violence: 'None',
      sexuality: 'None',
      profanity: 'None',
      controlledSubstances: 'None',
      gambling: 'None',
      userInteractions: 'None (Scores & Notifications broadcast)',
      estimatedRating: {
        brazilDJCTQ: 'Livre',
        pegi: 'PEGI 3',
        esrb: 'Everyone',
        usk: 'USK 0'
      },
      summary: 'Classificação IARC: Livre para todos os públicos (Sem conteúdo impróprio).'
    },

    // 5. Data Safety
    dataSafety: {
      dataCollected: [
        {
          type: 'Identificadores de Dispositivo',
          category: 'Device or other IDs',
          purposes: ['Funcionalidade do app (Envio de Notificações Push)', 'Análise de integridade'],
          isOptional: false,
          isEphemeral: true,
          isLinkedToUser: false,
          usedForTracking: false
        },
        {
          type: 'Localização Aproximada (Não precisa)',
          category: 'Location (Coarse location)',
          purposes: ['Publicidade e Marketing direcionado (Google AdMob)', 'Estatísticas de uso'],
          isOptional: true,
          isEphemeral: true,
          isLinkedToUser: false,
          usedForTracking: false
        }
      ],
      securityPractices: {
        dataEncryptedInTransit: true,
        encryptionStandard: 'HTTPS / TLS 1.3',
        canRequestDataDeletion: true,
        dataDeletionMechanism: 
          'Os tokens de push FCM expiram automaticamente após desinstalação ou podem ser limpos nas configurações do app desmarcando as notificações.',
        followsFamilyPolicy: false
      },
      privacyPolicyUrl: app.privacyPolicyUrl,
      summary: 'Data Safety: Criptografia HTTPS, Identificador FCM para push, Localização aproximada para AdMob, Política de Privacidade ativa.'
    },

    // 6. Acesso ao App
    appAccess: {
      accessType: 'ALL_FUNCTIONALITY_AVAILABLE',
      requiresLoginOrSubscription: false,
      instructions: 'Todas as seções (placar, tabela, artilharia, notícias, vídeos) estão totalmente disponíveis sem necessidade de login ou credenciais.'
    },

    // 7. Declarações Complementares
    additionalDeclarations: {
      isGovernmentApp: false,
      isFinancialApp: false,
      isHealthOrCovidApp: false,
      isNewsApp: true,
      newsDisclosure: 'Agregador de notícias públicas esportivas e acompanhamento de futebol em tempo real, sem vínculo governamental.'
    }
  };
}

export function getPlayConsoleFormChecklist(appId: string): { title: string; field: string; recommendedValue: string; status: 'ready' | 'pending' }[] {
  const app = getAppById(appId);
  const name = app?.name || 'ZapScore';
  const privacyUrl = app?.privacyPolicyUrl || 'https://zapscore.com.br/politica-de-privacidade';

  return [
    {
      title: 'Público-Alvo',
      field: 'Faixas etárias selecionadas',
      recommendedValue: '16 a 17 anos E 18 anos ou mais (16+)',
      status: 'ready'
    },
    {
      title: 'Política de Famílias',
      field: 'Atração não intencional por crianças',
      recommendedValue: 'Não (App puramente esportivo/estatístico)',
      status: 'ready'
    },
    {
      title: 'Categoria Primária',
      field: 'Categoria da Loja',
      recommendedValue: 'Esportes (SPORTS)',
      status: 'ready'
    },
    {
      title: 'Categoria Secundária / Tags',
      field: 'Tags de Descoberta',
      recommendedValue: 'Entretenimento (ENTERTAINMENT), Futebol, Placar ao Vivo',
      status: 'ready'
    },
    {
      title: 'Declaração de Anúncios',
      field: 'O app contém anúncios?',
      recommendedValue: 'Sim (Google AdMob)',
      status: 'ready'
    },
    {
      title: 'Acesso a Recursos do App',
      field: 'Instruções de Login para Revisores',
      recommendedValue: 'Todas as funcionalidades disponíveis sem login/restrição',
      status: 'ready'
    },
    {
      title: 'Segurança dos Dados (Data Safety)',
      field: 'Coleta de Identificador do Dispositivo',
      recommendedValue: 'Sim: Device ID para Notificações Push (FCM), Não vinculado à identidade',
      status: 'ready'
    },
    {
      title: 'Segurança dos Dados (Criptografia)',
      field: 'Dados criptografados em trânsito',
      recommendedValue: 'Sim (HTTPS / TLS)',
      status: 'ready'
    },
    {
      title: 'Política de Privacidade',
      field: 'URL da Política',
      recommendedValue: privacyUrl,
      status: 'ready'
    }
  ];
}
