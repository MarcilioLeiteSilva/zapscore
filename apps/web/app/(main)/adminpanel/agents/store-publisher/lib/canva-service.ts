import { EcosystemApp } from './apps-catalog';

export interface VisualAssetSpec {
  id: 'icon' | 'feature_graphic' | 'screenshot_1' | 'screenshot_2' | 'screenshot_3' | 'screenshot_4' | 'screenshot_5';
  title: string;
  type: 'icon' | 'feature_graphic' | 'screenshot';
  width: number;
  height: number;
  format: 'PNG' | 'JPEG';
  maxSizeBytes: number;
  description: string;
  copyHeadline: string;
  copySubtitle: string;
  canvaTemplateUrl?: string;
  status: 'pending' | 'generated' | 'uploaded';
  previewUrl?: string;
}

export interface AppVisualAssetsPackage {
  appId: string;
  packageName: string;
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  assets: VisualAssetSpec[];
  canvaProjectUrl: string;
}

/**
 * Gera os links e especificações visuais de acordo com os requisitos oficiais do Google Play Console
 * e compatibilidade com o Canva Pro.
 */
export function generateVisualAssetsSpecs(app: EcosystemApp): AppVisualAssetsPackage {
  // URLs de deep-link para criação de design com dimensões exatas no Canva
  const canvaFeatureGraphicLink = `https://www.canva.com/design/create?width=1024&height=500&units=px&title=${encodeURIComponent(`Feature Graphic 1024x500 - ${app.shortName}`)}`;
  const canvaScreenshotLink = `https://www.canva.com/design/create?width=1080&height=1920&units=px&title=${encodeURIComponent(`Screenshot 1080x1920 - ${app.shortName}`)}`;
  const canvaIconLink = `https://www.canva.com/design/create?width=512&height=512&units=px&title=${encodeURIComponent(`Icon 512x512 - ${app.shortName}`)}`;

  const assets: VisualAssetSpec[] = [
    // 1. Ícone do App em Alta Resolução (512x512)
    {
      id: 'icon',
      title: 'Ícone de Alta Resolução',
      type: 'icon',
      width: 512,
      height: 512,
      format: 'PNG',
      maxSizeBytes: 1024 * 1024, // 1MB
      description: 'Ícone quadrado de 512x512 px, PNG 32-bit com cantos retos (o Google Play aplica o arredondamento automaticamente).',
      copyHeadline: app.shortName,
      copySubtitle: 'ZapScore Oficial',
      canvaTemplateUrl: canvaIconLink,
      status: 'pending'
    },

    // 2. Imagem de Destaque / Feature Graphic (1024x500)
    {
      id: 'feature_graphic',
      title: 'Imagem de Destaque (Feature Graphic)',
      type: 'feature_graphic',
      width: 1024,
      height: 500,
      format: 'PNG',
      maxSizeBytes: 15 * 1024 * 1024, // 15MB
      description: 'Banner horizontal de 1024x500 px. Elemento mais impactante da vitrine da loja, com logo, troféu e identidade visual do torneio.',
      copyHeadline: `${app.shortName} Ao Vivo`,
      copySubtitle: 'Placar em Tempo Real, Tabela e Escalações Oficiais',
      canvaTemplateUrl: canvaFeatureGraphicLink,
      status: 'pending'
    },

    // 3. Screenshot 1: Placar Ao Vivo & Alerta de Gol
    {
      id: 'screenshot_1',
      title: 'Screenshot 1: Placar ao Vivo & Gol',
      type: 'screenshot',
      width: 1080,
      height: 1920,
      format: 'PNG',
      maxSizeBytes: 8 * 1024 * 1024,
      description: 'Mockup de smartphone moderno destacando notificação push instantânea de gol.',
      copyHeadline: 'GOL EM TEMPO REAL!',
      copySubtitle: 'Receba alertas instantâneos no momento exato do gol',
      canvaTemplateUrl: canvaScreenshotLink,
      status: 'pending'
    },

    // 4. Screenshot 2: Tabela de Classificação
    {
      id: 'screenshot_2',
      title: 'Screenshot 2: Tabela e Classificação',
      type: 'screenshot',
      width: 1080,
      height: 1920,
      format: 'PNG',
      maxSizeBytes: 8 * 1024 * 1024,
      description: 'Mockup destacando a classificação ao vivo, pontuação, G4, Z4 e chaveamento.',
      copyHeadline: 'TABELA ATUALIZADA',
      copySubtitle: 'Classificação completa, saldo de gols e simulação da rodada',
      canvaTemplateUrl: canvaScreenshotLink,
      status: 'pending'
    },

    // 5. Screenshot 3: Escalações Oficiais
    {
      id: 'screenshot_3',
      title: 'Screenshot 3: Escalações Oficiais',
      type: 'screenshot',
      width: 1080,
      height: 1920,
      format: 'PNG',
      maxSizeBytes: 8 * 1024 * 1024,
      description: 'Mockup demonstrando campo tático com os 22 titulares 50 minutos antes do jogo.',
      copyHeadline: 'ESCALAÇÕES 50M ANTES',
      copySubtitle: 'Titulares oficiais em campo antes da bola rolar',
      canvaTemplateUrl: canvaScreenshotLink,
      status: 'pending'
    },

    // 6. Screenshot 4: Comentários Táticos com IA
    {
      id: 'screenshot_4',
      title: 'Screenshot 4: Análise Tática ao Vivo',
      type: 'screenshot',
      width: 1080,
      height: 1920,
      format: 'PNG',
      maxSizeBytes: 8 * 1024 * 1024,
      description: 'Mockup com comentários táticos minuto a minuto gerados com inteligência artificial.',
      copyHeadline: 'ANÁLISE TÁTICA COM IA',
      copySubtitle: 'Insights minuto a minuto direto do gramado',
      canvaTemplateUrl: canvaScreenshotLink,
      status: 'pending'
    },

    // 7. Screenshot 5: Melhores Momentos & Vídeos
    {
      id: 'screenshot_5',
      title: 'Screenshot 5: Gols e Melhores Momentos',
      type: 'screenshot',
      width: 1080,
      height: 1920,
      format: 'PNG',
      maxSizeBytes: 8 * 1024 * 1024,
      description: 'Mockup com player de vídeo dos melhores momentos e artilharia atualizada.',
      copyHeadline: 'VÍDEOS DOS GOLS',
      copySubtitle: 'Assista aos melhores lances e acompanhe a artilharia',
      canvaTemplateUrl: canvaScreenshotLink,
      status: 'pending'
    }
  ];

  return {
    appId: app.id,
    packageName: app.packageName,
    appName: app.name,
    primaryColor: app.primaryColor,
    secondaryColor: app.secondaryColor,
    accentColor: app.accentColor,
    assets,
    canvaProjectUrl: `https://www.canva.com/folder/projects?q=${encodeURIComponent(app.shortName)}`
  };
}

/**
 * Validador de dimensões de imagem para upload
 */
export function validateAssetDimensions(
  assetType: VisualAssetSpec['type'],
  actualWidth: number,
  actualHeight: number
): { valid: boolean; message: string } {
  if (assetType === 'icon') {
    if (actualWidth === 512 && actualHeight === 512) {
      return { valid: true, message: 'Dimensão perfeita (512x512 px) para o Google Play Icon.' };
    }
    return { valid: false, message: `Dimensão inválida (${actualWidth}x${actualHeight}). Exigido exatamente 512x512 px.` };
  }

  if (assetType === 'feature_graphic') {
    if (actualWidth === 1024 && actualHeight === 500) {
      return { valid: true, message: 'Dimensão perfeita (1024x500 px) para o Feature Graphic.' };
    }
    return { valid: false, message: `Dimensão inválida (${actualWidth}x${actualHeight}). Exigido exatamente 1024x500 px.` };
  }

  if (assetType === 'screenshot') {
    // Google Play aceita proporção 9:16 (ex: 1080x1920)
    const ratio = actualHeight / actualWidth;
    if (actualWidth >= 1080 && Math.abs(ratio - (1920 / 1080)) < 0.05) {
      return { valid: true, message: `Resolução adequada (${actualWidth}x${actualHeight} px, proporção 9:16).` };
    }
    return { valid: false, message: `Dimensão inadequada (${actualWidth}x${actualHeight}). Recomendado 1080x1920 px (9:16).` };
  }

  return { valid: true, message: 'Arquivo validado.' };
}

/**
 * Gera um SVG pré-formatado de mockups de smartphone para pré-visualização instantânea no painel
 */
export function generateSvgMockupPreview(
  app: EcosystemApp,
  asset: VisualAssetSpec
): string {
  if (asset.type === 'feature_graphic') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500" width="100%" height="100%">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${app.secondaryColor}"/>
          <stop offset="50%" stop-color="${app.primaryColor}"/>
          <stop offset="100%" stop-color="#090d16"/>
        </linearGradient>
      </defs>
      <rect width="1024" height="500" fill="url(#grad)"/>
      <circle cx="900" cy="100" r="300" fill="${app.accentColor}" opacity="0.12" filter="blur(40px)"/>
      <circle cx="150" cy="400" r="250" fill="${app.primaryColor}" opacity="0.2" filter="blur(30px)"/>
      <g transform="translate(80, 180)">
        <text font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="${app.accentColor}" letter-spacing="4">ZAPSCORE APPS</text>
        <text y="70" font-family="Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff">${app.shortName.toUpperCase()}</text>
        <text y="125" font-family="Arial, sans-serif" font-size="24" fill="#94a3b8">${app.leagueName}</text>
        <rect y="160" width="220" height="48" rx="24" fill="${app.accentColor}"/>
        <text x="110" y="191" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#000000" text-anchor="middle">AO VIVO &amp; EM CORES</text>
      </g>
    </svg>`;
  }

  if (asset.type === 'icon') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
      <defs>
        <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${app.primaryColor}"/>
          <stop offset="100%" stop-color="${app.secondaryColor}"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="100" fill="url(#iconGrad)"/>
      <circle cx="256" cy="230" r="120" fill="#ffffff" opacity="0.1"/>
      <path d="M256 140 L340 280 L172 280 Z" fill="${app.accentColor}"/>
      <text x="256" y="420" font-family="Arial, sans-serif" font-size="60" font-weight="900" fill="#ffffff" text-anchor="middle">${app.shortName.toUpperCase().slice(0, 4)}</text>
    </svg>`;
  }

  // Screenshots 1080x1920
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="100%" height="100%">
    <defs>
      <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0b0f19"/>
        <stop offset="50%" stop-color="${app.secondaryColor}"/>
        <stop offset="100%" stop-color="#020408"/>
      </linearGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#screenGrad)"/>
    <g transform="translate(100, 180)">
      <text font-family="Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle" x="440">${asset.copyHeadline}</text>
      <text y="70" font-family="Arial, sans-serif" font-size="32" fill="#94a3b8" text-anchor="middle" x="440">${asset.copySubtitle}</text>
    </g>
    <!-- Smartphone Frame -->
    <g transform="translate(180, 380)">
      <rect width="720" height="1440" rx="60" fill="#1e293b" stroke="#334155" stroke-width="8"/>
      <rect x="20" y="30" width="680" height="1380" rx="40" fill="#090d16"/>
      <!-- Notch / Dynamic Island -->
      <rect x="260" y="45" width="200" height="28" rx="14" fill="#000000"/>
      <!-- Header do App -->
      <rect x="20" y="30" width="680" height="140" fill="${app.primaryColor}" opacity="0.9"/>
      <text x="360" y="115" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="#ffffff" text-anchor="middle">${app.shortName} ZapScore</text>
      <!-- Placar Mockup -->
      <rect x="60" y="240" width="600" height="260" rx="24" fill="#131c2e" stroke="#334155" stroke-width="2"/>
      <circle cx="160" cy="340" r="45" fill="${app.primaryColor}"/>
      <text x="160" y="352" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">MAND</text>
      <text x="360" y="360" font-family="Arial, sans-serif" font-size="54" font-weight="900" fill="#ffffff" text-anchor="middle">2 - 1</text>
      <circle cx="560" cy="340" r="45" fill="${app.secondaryColor}"/>
      <text x="560" y="352" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">VIS</text>
      <rect x="270" y="440" width="180" height="36" rx="18" fill="#10B981"/>
      <text x="360" y="464" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">AO VIVO 78'</text>
    </g>
  </svg>`;
}
