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
  // URLs de deep-link seguras para busca de templates e projetos no Canva (sem erro 400/404)
  const canvaFeatureGraphicLink = `https://www.canva.com/templates/?query=${encodeURIComponent(`google play feature graphic 1024x500 ${app.shortName}`)}`;
  const canvaScreenshotLink = `https://www.canva.com/templates/?query=${encodeURIComponent(`app store screenshot 1080x1920 ${app.shortName}`)}`;
  const canvaIconLink = `https://www.canva.com/templates/?query=${encodeURIComponent(`app icon 512x512 ${app.shortName}`)}`;

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
    canvaProjectUrl: `https://www.canva.com/projects?query=${encodeURIComponent(app.shortName)}`
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
 * Renderiza um SVG em um elemento Canvas e realiza o download direto como arquivo PNG de alta resolução.
 */
export function downloadSvgAsPng(
  svgString: string,
  fileName: string,
  targetWidth: number,
  targetHeight: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URLObj = window.URL || window.webkitURL || window;
    const blobUrl = URLObj.createObjectURL(svgBlob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URLObj.revokeObjectURL(blobUrl);
          reject(new Error('Contexto 2D do Canvas não disponível'));
          return;
        }

        ctx.clearRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        URLObj.revokeObjectURL(blobUrl);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Falha ao gerar o blob PNG'));
            return;
          }
          const pngUrl = URLObj.createObjectURL(blob);
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = fileName;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          setTimeout(() => URLObj.revokeObjectURL(pngUrl), 2000);
          resolve();
        }, 'image/png');
      } catch (err) {
        URLObj.revokeObjectURL(blobUrl);
        reject(err);
      }
    };

    img.onerror = (err) => {
      URLObj.revokeObjectURL(blobUrl);
      reject(err);
    };

    img.src = blobUrl;
  });
}

/**
 * Gera um SVG pré-formatado de mockups de smartphone para pré-visualização instantânea e exportação autônoma em PNG
 */
export function generateSvgMockupPreview(
  app: EcosystemApp,
  asset: VisualAssetSpec
): string {
  if (asset.type === 'feature_graphic') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500" width="1024" height="500">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${app.secondaryColor}"/>
          <stop offset="50%" stop-color="${app.primaryColor}"/>
          <stop offset="100%" stop-color="#090d16"/>
        </linearGradient>
      </defs>
      <rect width="1024" height="500" fill="url(#grad)"/>
      <circle cx="900" cy="100" r="300" fill="${app.accentColor}" opacity="0.15"/>
      <circle cx="150" cy="400" r="250" fill="${app.primaryColor}" opacity="0.25"/>
      <g transform="translate(80, 160)">
        <text font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${app.accentColor}" letter-spacing="4">ZAPSCORE APPS</text>
        <text y="70" font-family="Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff">${app.shortName.toUpperCase()}</text>
        <text y="125" font-family="Arial, sans-serif" font-size="24" fill="#94a3b8">${app.leagueName}</text>
        <rect y="160" width="230" height="48" rx="24" fill="${app.accentColor}"/>
        <text x="115" y="191" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#000000" text-anchor="middle">AO VIVO &amp; EM CORES</text>
      </g>
    </svg>`;
  }

  if (asset.type === 'icon') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <defs>
        <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${app.primaryColor}"/>
          <stop offset="100%" stop-color="${app.secondaryColor}"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="100" fill="url(#iconGrad)"/>
      <circle cx="256" cy="220" r="110" fill="#ffffff" opacity="0.12"/>
      <path d="M256 130 L335 260 L177 260 Z" fill="${app.accentColor}"/>
      <text x="256" y="390" font-family="Arial, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle">${app.shortName.toUpperCase().slice(0, 5)}</text>
      <text x="256" y="440" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${app.accentColor}" text-anchor="middle">ZAPSCORE</text>
    </svg>`;
  }

  // Detalhes visuais internos do Smartphone por tipo de screenshot
  let screenDetail = '';
  if (asset.id === 'screenshot_1') {
    // Placar ao vivo & Gol
    screenDetail = `
      <rect x="60" y="240" width="600" height="260" rx="24" fill="#131c2e" stroke="#334155" stroke-width="2"/>
      <circle cx="160" cy="340" r="45" fill="${app.primaryColor}"/>
      <text x="160" y="352" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">MAND</text>
      <text x="360" y="360" font-family="Arial, sans-serif" font-size="54" font-weight="900" fill="#ffffff" text-anchor="middle">2 - 1</text>
      <circle cx="560" cy="340" r="45" fill="${app.secondaryColor}"/>
      <text x="560" y="352" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">VIS</text>
      <rect x="270" y="440" width="180" height="36" rx="18" fill="#10B981"/>
      <text x="360" y="464" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">GOL! 78'</text>
    `;
  } else if (asset.id === 'screenshot_2') {
    // Tabela de Classificação
    screenDetail = `
      <rect x="50" y="220" width="620" height="520" rx="20" fill="#131c2e" stroke="#334155" stroke-width="2"/>
      <text x="80" y="265" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#94a3b8">#  CLUBE          P   J   V   SG</text>
      <line x1="70" y1="285" x2="650" y2="285" stroke="#334155" stroke-width="1"/>
      <rect x="70" y="300" width="580" height="46" rx="8" fill="#10B981" fill-opacity="0.15"/>
      <text x="80" y="332" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#10B981">1  Líder do Grupo   28  12   9  +15</text>
      <text x="80" y="382" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">2  Vice-Líder       25  12   8  +11</text>
      <text x="80" y="432" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">3  Terceiro         22  12   7   +8</text>
      <text x="80" y="482" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">4  Quarto           20  12   6   +5</text>
      <text x="80" y="532" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#94a3b8">5  Quinto           17  12   5   +2</text>
    `;
  } else if (asset.id === 'screenshot_3') {
    // Escalações 50min antes (Campinho Tático)
    screenDetail = `
      <rect x="50" y="220" width="620" height="600" rx="20" fill="#064e3b" stroke="#10b981" stroke-width="3"/>
      <circle cx="360" cy="520" r="80" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.4"/>
      <line x1="50" y1="520" x2="670" y2="520" stroke="#ffffff" stroke-width="2" opacity="0.4"/>
      <rect x="230" y="220" width="260" height="120" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.4"/>
      <circle cx="360" cy="270" r="18" fill="${app.accentColor}"/>
      <circle cx="180" cy="380" r="18" fill="${app.primaryColor}"/>
      <circle cx="360" cy="380" r="18" fill="${app.primaryColor}"/>
      <circle cx="540" cy="380" r="18" fill="${app.primaryColor}"/>
      <rect x="240" y="750" width="240" height="44" rx="22" fill="#0f172a"/>
      <text x="360" y="778" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">ESCALAÇÃO 4-3-3</text>
    `;
  } else if (asset.id === 'screenshot_4') {
    // Comentários Táticos com IA
    screenDetail = `
      <rect x="50" y="220" width="620" height="420" rx="20" fill="#131c2e" stroke="#8b5cf6" stroke-width="2"/>
      <rect x="75" y="245" width="200" height="34" rx="17" fill="#8b5cf6" fill-opacity="0.2"/>
      <text x="175" y="268" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#a78bfa" text-anchor="middle">COPILOT IA AO VIVO</text>
      <text x="75" y="320" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff">Pressão Total no Campo de Ataque</text>
      <text x="75" y="360" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8">Time da casa adianta a linha de marcação</text>
      <text x="75" y="390" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8">e explora velocidade pelos flancos.</text>
      <rect x="75" y="440" width="570" height="40" rx="10" fill="#1e293b"/>
      <text x="95" y="466" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#10B981">72' Análise Atualizada em Tempo Real</text>
    `;
  } else {
    // screenshot_5: Melhores Momentos & Vídeos
    screenDetail = `
      <rect x="50" y="220" width="620" height="360" rx="20" fill="#131c2e" stroke="#ef4444" stroke-width="2"/>
      <circle cx="360" cy="380" r="50" fill="#ef4444"/>
      <polygon points="350,360 380,380 350,400" fill="#ffffff"/>
      <text x="360" y="470" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">MELHORES MOMENTOS</text>
      <rect x="50" y="600" width="620" height="80" rx="16" fill="#1e293b"/>
      <text x="80" y="648" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">Artilharia: 8 Gols na Competição</text>
    `;
  }

  // Screenshots 1080x1920
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
    <defs>
      <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0b0f19"/>
        <stop offset="50%" stop-color="${app.secondaryColor}"/>
        <stop offset="100%" stop-color="#020408"/>
      </linearGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#screenGrad)"/>
    <g transform="translate(100, 160)">
      <text font-family="Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle" x="440">${asset.copyHeadline}</text>
      <text y="70" font-family="Arial, sans-serif" font-size="30" fill="#94a3b8" text-anchor="middle" x="440">${asset.copySubtitle}</text>
    </g>
    <!-- Smartphone Frame -->
    <g transform="translate(180, 340)">
      <rect width="720" height="1500" rx="60" fill="#1e293b" stroke="#334155" stroke-width="8"/>
      <rect x="20" y="30" width="680" height="1440" rx="40" fill="#090d16"/>
      <!-- Notch / Dynamic Island -->
      <rect x="260" y="45" width="200" height="28" rx="14" fill="#000000"/>
      <!-- Header do App -->
      <rect x="20" y="30" width="680" height="140" fill="${app.primaryColor}" opacity="0.9"/>
      <text x="360" y="115" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="#ffffff" text-anchor="middle">${app.shortName} ZapScore</text>
      ${screenDetail}
    </g>
  </svg>`;
}

