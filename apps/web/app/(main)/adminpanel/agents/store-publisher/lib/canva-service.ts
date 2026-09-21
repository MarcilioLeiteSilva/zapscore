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
 * Gera um SVG de bola de futebol clássica vetorizada com borda branca tipo adesivo (sticker)
 * seguindo estritamente a identidade visual oficial do ecossistema ZapScore.
 */
export function generateVectorSoccerBall(
  cx: number,
  cy: number,
  r: number,
  panelColor: string = '#2563eb'
): string {
  const strokeW = Math.max(4, Math.round(r * 0.045));
  const stickerW = Math.max(8, Math.round(r * 0.09));

  // Geometria precisa dos gomos de futebol clássico
  // Gomo central: Hexágono branco
  const rCenter = r * 0.36;
  const cPoints: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    cPoints.push([cx + rCenter * Math.cos(angle), cy + rCenter * Math.sin(angle)]);
  }
  const centerHexPath = cPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ' Z';

  // 5 Gomos Coloridos em torno do centro (com contorno e preenchimento colorido)
  // Top, Top-Right, Bottom-Right, Bottom-Left, Top-Left
  const pentagonPaths = [
    // Top
    `M ${cx - r * 0.28},${cy - r * 0.58} L ${cx + r * 0.28},${cy - r * 0.58} L ${cx + r * 0.42},${cy - r * 0.88} L ${cx - r * 0.42},${cy - r * 0.88} Z`,
    // Top-Right
    `M ${cx + r * 0.45},${cy - r * 0.2} L ${cx + r * 0.76},${cy - r * 0.42} L ${cx + r * 0.94},${cy - r * 0.12} L ${cx + r * 0.72},${cy + r * 0.25} Z`,
    // Bottom-Right
    `M ${cx + r * 0.22},${cy + r * 0.42} L ${cx + r * 0.58},${cy + r * 0.55} L ${cx + r * 0.42},${cy + r * 0.92} L ${cx},${cy + r * 0.72} Z`,
    // Bottom-Left
    `M ${cx - r * 0.22},${cy + r * 0.42} L ${cx},${cy + r * 0.72} L ${cx - r * 0.42},${cy + r * 0.92} L ${cx - r * 0.58},${cy + r * 0.55} Z`,
    // Top-Left
    `M ${cx - r * 0.45},${cy - r * 0.2} L ${cx - r * 0.72},${cy + r * 0.25} L ${cx - r * 0.94},${cy - r * 0.12} L ${cx - r * 0.76},${cy - r * 0.42} Z`
  ];

  // Linhas de conexão pretas entre os gomos
  const connectLines = [
    `M ${cPoints[0][0]},${cPoints[0][1]} L ${cx + r * 0.45},${cy - r * 0.2}`,
    `M ${cPoints[1][0]},${cPoints[1][1]} L ${cx + r * 0.22},${cy + r * 0.42}`,
    `M ${cPoints[2][0]},${cPoints[2][1]} L ${cx},${cy + r * 0.72}`,
    `M ${cPoints[3][0]},${cPoints[3][1]} L ${cx - r * 0.22},${cy + r * 0.42}`,
    `M ${cPoints[4][0]},${cPoints[4][1]} L ${cx - r * 0.45},${cy - r * 0.2}`,
    `M ${cPoints[5][0]},${cPoints[5][1]} L ${cx},${cy - r * 0.58}`
  ].join(' ');

  return `
    <g id="vector-soccer-ball">
      <!-- Contorno Branco Externo Tipo Adesivo (Sticker Effect) -->
      <circle cx="${cx}" cy="${cy}" r="${r + stickerW}" fill="#ffffff" />

      <!-- Base da Bola com Sombreamento Sutil -->
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#f8fafc" stroke="#111827" stroke-width="${strokeW}" />

      <!-- Sombra Esférica no Crescente Inferior -->
      <path d="M ${cx - r},${cy} A ${r} ${r} 0 0 0 ${cx + r},${cy} A ${r * 0.9} ${r * 0.9} 0 0 1 ${cx - r},${cy} Z" fill="#000000" opacity="0.08" />

      <!-- Gomo Central Hexagonal Branco com Borda Preta -->
      <path d="${centerHexPath}" fill="#ffffff" stroke="#111827" stroke-width="${strokeW}" stroke-linejoin="round" />

      <!-- Gomos Coloridos em Torno da Bola -->
      ${pentagonPaths.map((p) => `<path d="${p}" fill="${panelColor}" stroke="#111827" stroke-width="${strokeW}" stroke-linejoin="round" />`).join('\n')}

      <!-- Linhas de Costura Conectoras -->
      <path d="${connectLines}" fill="none" stroke="#111827" stroke-width="${strokeW}" stroke-linecap="round" />

      <!-- Brilho de Luz no Topo Esquerdo -->
      <ellipse cx="${cx - r * 0.45}" cy="${cy - r * 0.45}" rx="${r * 0.25}" ry="${r * 0.12}" transform="rotate(-35 ${cx - r * 0.45} ${cy - r * 0.45})" fill="#ffffff" opacity="0.35" />
    </g>
  `;
}

/**
 * Gera os SVGs de alta fidelidade visual para cada um dos 7 assets oficiais da Play Store.
 */
export function generateSvgMockupPreview(
  app: EcosystemApp,
  asset: VisualAssetSpec
): string {
  const panelColor = app.accentColor || app.secondaryColor || '#3b82f6';
  const primary = app.primaryColor || '#15803d';

  // -------------------------------------------------------------
  // 1. ÍCONE OFICIAL DO APP (512x512)
  // Fundo Squircle na cor do torneio + Bola de Futebol com Sticker Branco
  // -------------------------------------------------------------
  if (asset.type === 'icon') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <defs>
        <radialGradient id="iconBgGrad" cx="30%" cy="20%" r="90%">
          <stop offset="0%" stop-color="${primary}" stop-opacity="1"/>
          <stop offset="100%" stop-color="${primary}" stop-opacity="0.88"/>
        </radialGradient>
      </defs>
      
      <!-- Fundo Squircle Suave -->
      <rect width="512" height="512" rx="115" fill="url(#iconBgGrad)"/>
      
      <!-- Sombra da Bola no Fundo -->
      <ellipse cx="256" cy="425" rx="170" ry="24" fill="#000000" opacity="0.22"/>
      
      <!-- Bola Oficial com Adesivo Branco -->
      ${generateVectorSoccerBall(256, 252, 172, panelColor)}
    </svg>`;
  }

  // -------------------------------------------------------------
  // 2. FEATURE GRAPHIC DE VITRINE (1024x500)
  // Cenário: Estádio iluminado com refletores + gramado verde
  // Esquerda: "Campeonato" branco + "Nome" colorido com contorno branco espesso + Ícone no rodapé
  // Direita: Smartphone em 3D inclinado mostrando o menu real do app
  // -------------------------------------------------------------
  if (asset.type === 'feature_graphic') {
    const isCopa = app.name.toLowerCase().includes('copa');
    const firstLineText = isCopa ? 'Copa' : 'Campeonato';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500" width="1024" height="500">
      <defs>
        <!-- Céu Noturno do Estádio -->
        <linearGradient id="stadiumSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#02163b"/>
          <stop offset="60%" stop-color="#073268"/>
          <stop offset="100%" stop-color="#0f4582"/>
        </linearGradient>

        <!-- Faixes de Luz dos Refletores -->
        <radialGradient id="lightBeamLeft" cx="0%" cy="0%" r="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.75"/>
          <stop offset="25%" stop-color="#38bdf8" stop-opacity="0.35"/>
          <stop offset="80%" stop-color="#0284c7" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="lightBeamRight" cx="100%" cy="0%" r="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.75"/>
          <stop offset="25%" stop-color="#38bdf8" stop-opacity="0.35"/>
          <stop offset="80%" stop-color="#0284c7" stop-opacity="0"/>
        </radialGradient>

        <!-- Gramado Verde com Perspectiva -->
        <linearGradient id="grassField" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0d5726"/>
          <stop offset="40%" stop-color="#15803d"/>
          <stop offset="100%" stop-color="#16a34a"/>
        </linearGradient>
      </defs>

      <!-- Fundo: Céu Estrelado / Arquibancada Escura -->
      <rect width="1024" height="500" fill="url(#stadiumSky)"/>

      <!-- Arquibancada de Fundo (Silhuetas e Luzes de Público) -->
      <path d="M-50,340 Q512,300 1074,340 L1074,390 Q512,350 -50,390 Z" fill="#091c3d" opacity="0.9"/>
      <ellipse cx="512" cy="345" rx="550" ry="12" fill="#38bdf8" opacity="0.15"/>

      <!-- Feixes de Luz dos Refletores -->
      <polygon points="0,0 260,0 600,500 0,500" fill="url(#lightBeamLeft)" opacity="0.45"/>
      <polygon points="1024,0 764,0 424,500 1024,500" fill="url(#lightBeamRight)" opacity="0.45"/>

      <!-- Refletor Esquerdo (Lâmpadas LED Acesas) -->
      <g transform="translate(-10, -10) rotate(18)">
        <rect x="0" y="0" width="170" height="75" rx="14" fill="#0f172a" stroke="#334155" stroke-width="3"/>
        <g fill="#ffffff">
          <circle cx="25" cy="22" r="9"/><circle cx="55" cy="22" r="9"/><circle cx="85" cy="22" r="9"/><circle cx="115" cy="22" r="9"/><circle cx="145" cy="22" r="9"/>
          <circle cx="25" cy="52" r="9"/><circle cx="55" cy="52" r="9"/><circle cx="85" cy="52" r="9"/><circle cx="115" cy="52" r="9"/><circle cx="145" cy="52" r="9"/>
        </g>
      </g>

      <!-- Refletor Direito (Lâmpadas LED Acesas) -->
      <g transform="translate(1034, -10) rotate(-18) scale(-1, 1)">
        <rect x="0" y="0" width="170" height="75" rx="14" fill="#0f172a" stroke="#334155" stroke-width="3"/>
        <g fill="#ffffff">
          <circle cx="25" cy="22" r="9"/><circle cx="55" cy="22" r="9"/><circle cx="85" cy="22" r="9"/><circle cx="115" cy="22" r="9"/><circle cx="145" cy="22" r="9"/>
          <circle cx="25" cy="52" r="9"/><circle cx="55" cy="52" r="9"/><circle cx="85" cy="52" r="9"/><circle cx="115" cy="52" r="9"/><circle cx="145" cy="52" r="9"/>
        </g>
      </g>

      <!-- Gramado Verde em Perspectiva na Base -->
      <path d="M-80,510 L-40,360 Q512,320 1064,360 L1104,510 Z" fill="url(#grassField)"/>
      <!-- Faixas de Corte de Grama -->
      <polygon points="120,355 220,355 180,500 50,500" fill="#15803d" opacity="0.4"/>
      <polygon points="340,350 440,350 420,500 300,500" fill="#15803d" opacity="0.4"/>
      <polygon points="560,350 660,350 670,500 550,500" fill="#15803d" opacity="0.4"/>
      <polygon points="780,355 880,355 920,500 800,500" fill="#15803d" opacity="0.4"/>

      <!-- ========================================================= -->
      <!-- LADO ESQUERDO: TIPOGRAFIA DE IMPACTO COM CONTORNO BRANCO -->
      <!-- ========================================================= -->
      <!-- Linha 1: "Campeonato" em Branco Espesso -->
      <text x="80" y="145" font-family="'Outfit', 'Montserrat', 'Inter', Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff" letter-spacing="-1">
        ${firstLineText}
      </text>

      <!-- Linha 2: Nome do Campeonato Colorido com Contorno Branco Grosso em Alto Relevo -->
      <text x="80" y="235" font-family="'Outfit', 'Montserrat', 'Inter', Arial, sans-serif" font-size="78" font-weight="900" fill="${primary}" stroke="#ffffff" stroke-width="16" paint-order="stroke fill" stroke-linejoin="round" letter-spacing="-1">
        ${app.shortName}
      </text>

      <!-- Canto Inferior Esquerdo: Ícone do App com Borda Branca -->
      <g transform="translate(80, 280)">
        <rect width="130" height="130" rx="32" fill="${primary}" stroke="#ffffff" stroke-width="5"/>
        <g transform="translate(-65, -60) scale(0.65)">
          ${generateVectorSoccerBall(200, 195, 78, panelColor)}
        </g>
      </g>

      <!-- ========================================================= -->
      <!-- LADO DIREITO: SMARTPHONE EM 3D MOSTRANDO O MENU DO APP   -->
      <!-- ========================================================= -->
      <g transform="translate(680, 50) rotate(13)">
        <!-- Sombra do Celular -->
        <rect x="18" y="24" width="280" height="520" rx="44" fill="#000000" opacity="0.4" filter="blur(15px)"/>

        <!-- Chassi Metálico Dourado/Titânio do Celular -->
        <rect x="0" y="0" width="280" height="520" rx="44" fill="#1e293b" stroke="#e2e8f0" stroke-width="6"/>
        <rect x="6" y="6" width="268" height="508" rx="38" fill="#0a3d24"/>

        <!-- Notch / Câmera Superior -->
        <rect x="95" y="16" width="90" height="18" rx="9" fill="#000000"/>
        <circle cx="165" cy="25" r="4" fill="#1e293b"/>

        <!-- Display: Menu / Drawer Real do App -->
        <g transform="translate(14, 42)">
          <!-- Topo do Menu: Ícone Mini + Nome -->
          <g transform="translate(100, 15) scale(0.35)">
            <rect x="-40" y="-40" width="130" height="130" rx="28" fill="${primary}"/>
            ${generateVectorSoccerBall(25, 25, 52, panelColor)}
          </g>
          <text x="126" y="75" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">
            Campeonato ${app.shortName}
          </text>

          <!-- Itens do Menu com Ícones -->
          <g transform="translate(18, 98)" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff">
            <g transform="translate(0, 0)"><circle cx="8" cy="8" r="7" fill="${panelColor}" opacity="0.3"/><text x="24" y="12">⚽  Rodadas</text></g>
            <g transform="translate(0, 32)"><circle cx="8" cy="8" r="7" fill="${panelColor}" opacity="0.3"/><text x="24" y="12">🏆  Tabela</text></g>
            <g transform="translate(0, 64)"><circle cx="8" cy="8" r="7" fill="${panelColor}" opacity="0.3"/><text x="24" y="12">🥇  Artilheiros</text></g>
            <g transform="translate(0, 96)"><circle cx="8" cy="8" r="7" fill="${panelColor}" opacity="0.3"/><text x="24" y="12">📰  Notícias</text></g>
            <g transform="translate(0, 128)"><circle cx="8" cy="8" r="7" fill="${panelColor}" opacity="0.3"/><text x="24" y="12">🎥  Vídeos</text></g>
            <g transform="translate(0, 160)"><circle cx="8" cy="8" r="7" fill="${panelColor}" opacity="0.3"/><text x="24" y="12">✨  Palpites da IA</text></g>
            <g transform="translate(0, 192)"><circle cx="8" cy="8" r="7" fill="${panelColor}" opacity="0.3"/><text x="24" y="12">⚙️  Configurações</text></g>
          </g>

          <!-- Barra de Navegação Inferior no Celular -->
          <rect x="0" y="415" width="252" height="42" fill="#062817"/>
          <g fill="#94a3b8" font-size="9" font-family="Arial, sans-serif" text-anchor="middle">
            <text x="26" y="438">🏠 Início</text>
            <text x="76" y="438">⭐ Favoritos</text>
            <text x="126" y="438">📰 Notícias</text>
            <text x="176" y="438">📺 Assistir</text>
            <text x="226" y="438">⚙️ Ajustes</text>
          </g>
        </g>
      </g>
    </svg>`;
  }

  // -------------------------------------------------------------
  // 3. SCREENSHOTS OFICIAIS (1080x1920)
  // Moldura: Smartphone Titânio/Prata com bordas arredondadas e notch
  // Tela: 100% PREENCHIDA com dados reais e Barra de Navegação Inferior
  // -------------------------------------------------------------
  let screenContent = '';

  // 1. Screenshot 1: Placar Ao Vivo & Alerta de Gol
  if (asset.id === 'screenshot_1') {
    screenContent = `
      <!-- Status Bar -->
      <g fill="#94a3b8" font-size="16" font-family="Arial, sans-serif" font-weight="bold">
        <text x="40" y="32">16:45</text>
        <text x="680" y="32" text-anchor="end">5G  📶 100% 🔋</text>
      </g>

      <!-- Header do App -->
      <rect x="0" y="48" width="720" height="74" fill="${primary}"/>
      <text x="40" y="94" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#ffffff">
        ${app.shortName.toUpperCase()} ZAPSCORE
      </text>
      <text x="680" y="94" font-family="Arial, sans-serif" font-size="20" fill="#ffffff" text-anchor="end">🔔 🔍</text>

      <!-- Carrossel de Datas -->
      <g transform="translate(0, 136)">
        <rect x="0" y="0" width="720" height="44" fill="#0f172a"/>
        <text x="140" y="28" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle">ONTEM</text>
        <rect x="270" y="6" width="180" height="32" rx="16" fill="${primary}"/>
        <text x="360" y="27" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">HOJE (AO VIVO)</text>
        <text x="580" y="28" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle">AMANHÃ</text>
      </g>

      <!-- HERO CARD: JOGO AO VIVO EM TEMPO REAL -->
      <g transform="translate(30, 200)">
        <rect width="660" height="290" rx="24" fill="#0f172a" stroke="#334155" stroke-width="2"/>
        
        <!-- Badge Ao Vivo Pulsante -->
        <rect x="255" y="18" width="150" height="30" rx="15" fill="#ef4444"/>
        <circle cx="275" cy="33" r="5" fill="#ffffff"/>
        <text x="335" y="38" font-family="Arial, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">AO VIVO 78' 2T</text>

        <!-- Time Mandante -->
        <circle cx="120" cy="115" r="44" fill="${primary}"/>
        <text x="120" y="125" font-family="Arial, sans-serif" font-size="26" font-weight="900" fill="#ffffff" text-anchor="middle">SAM</text>
        <text x="120" y="180" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">Sampaio Corrêa</text>

        <!-- Placar Central -->
        <text x="240" y="145" font-family="Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle">2</text>
        <text x="330" y="135" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#64748b" text-anchor="middle">x</text>
        <text x="420" y="145" font-family="Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle">1</text>

        <!-- Time Visitante -->
        <circle cx="540" cy="115" r="44" fill="${panelColor}"/>
        <text x="540" y="125" font-family="Arial, sans-serif" font-size="26" font-weight="900" fill="#ffffff" text-anchor="middle">MOT</text>
        <text x="540" y="180" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">Moto Club</text>

        <!-- Banner de Gol Instantâneo -->
        <rect x="30" y="215" width="600" height="52" rx="16" fill="#10b981"/>
        <text x="330" y="247" font-family="Arial, sans-serif" font-size="17" font-weight="900" fill="#ffffff" text-anchor="middle">
          ⚽ GOL! 76' Pimentinha (Chute colocado no ângulo)
        </text>
      </g>

      <!-- ESTATÍSTICAS DA PARTIDA AO VIVO -->
      <g transform="translate(30, 510)">
        <rect width="660" height="175" rx="20" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
        <text x="30" y="35" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#94a3b8">ESTATÍSTICAS EM TEMPO REAL</text>
        
        <!-- Posse de Bola -->
        <text x="30" y="70" font-family="Arial, sans-serif" font-size="14" fill="#ffffff">56% Posse de Bola</text>
        <text x="630" y="70" font-family="Arial, sans-serif" font-size="14" fill="#ffffff" text-anchor="end">44%</text>
        <rect x="30" y="80" width="600" height="12" rx="6" fill="#1e293b"/>
        <rect x="30" y="80" width="336" height="12" rx="6" fill="#10b981"/>

        <!-- Finalizações e Faltas -->
        <g transform="translate(30, 115)" font-family="Arial, sans-serif" font-size="14" fill="#cbd5e1">
          <text x="0" y="18">Finalizações:</text><text x="140" y="18" font-weight="bold" fill="#ffffff">14 (8 no gol)</text>
          <text x="380" y="18">Finalizações:</text><text x="590" y="18" font-weight="bold" fill="#ffffff" text-anchor="end">9 (4 no gol)</text>
          <text x="0" y="44">Cartões:</text><text x="140" y="44" font-weight="bold" fill="#eab308">🟡 2</text>
          <text x="380" y="44">Cartões:</text><text x="590" y="44" font-weight="bold" fill="#ef4444" text-anchor="end">🟡 3  🔴 1</text>
        </g>
      </g>

      <!-- OUTROS JOGOS DA RODADA (FEED PREENCHIDO) -->
      <g transform="translate(30, 705)">
        <text x="5" y="25" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#94a3b8">OUTROS JOGOS DA RODADA</text>

        <!-- Jogo 2 -->
        <rect y="40" width="660" height="90" rx="18" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
        <text x="30" y="92" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">Maranhão AC  2 x 0  Imperatriz</text>
        <rect x="520" y="68" width="115" height="30" rx="15" fill="#334155"/>
        <text x="577" y="88" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#94a3b8" text-anchor="middle">ENCERRADO FT</text>

        <!-- Jogo 3 -->
        <rect y="145" width="660" height="90" rx="18" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
        <text x="30" y="197" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">Cordino  vs  Tuntum</text>
        <rect x="520" y="173" width="115" height="30" rx="15" fill="#1e293b"/>
        <text x="577" y="193" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#38bdf8" text-anchor="middle">HOJE 20:00</text>

        <!-- Jogo 4 -->
        <rect y="250" width="660" height="90" rx="18" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
        <text x="30" y="302" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">Pinheiro  vs  Chapadinha</text>
        <rect x="520" y="278" width="115" height="30" rx="15" fill="#1e293b"/>
        <text x="577" y="298" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#94a3b8" text-anchor="middle">AMANHÃ 16:00</text>
      </g>
    `;
  }

  // 2. Screenshot 2: Tabela de Classificação Atualizada
  else if (asset.id === 'screenshot_2') {
    screenContent = `
      <!-- Status Bar -->
      <g fill="#94a3b8" font-size="16" font-family="Arial, sans-serif" font-weight="bold">
        <text x="40" y="32">16:45</text>
        <text x="680" y="32" text-anchor="end">5G  📶 100% 🔋</text>
      </g>

      <!-- Header do App -->
      <rect x="0" y="48" width="720" height="74" fill="${primary}"/>
      <text x="40" y="94" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#ffffff">
        TABELA • ${app.shortName.toUpperCase()} 2026
      </text>
      <text x="680" y="94" font-family="Arial, sans-serif" font-size="20" fill="#ffffff" text-anchor="end">🔄</text>

      <!-- Filtros de Fase -->
      <g transform="translate(30, 140)">
        <rect x="0" y="0" width="150" height="38" rx="19" fill="${primary}"/>
        <text x="75" y="24" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">1ª FASE</text>
        <rect x="165" y="0" width="150" height="38" rx="19" fill="#1e293b"/>
        <text x="240" y="24" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#94a3b8" text-anchor="middle">SEMIFINAL</text>
        <rect x="330" y="0" width="150" height="38" rx="19" fill="#1e293b"/>
        <text x="405" y="24" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#94a3b8" text-anchor="middle">FINAL</text>
      </g>

      <!-- TABELA COMPLETA PREENCHENDO A TELA -->
      <g transform="translate(30, 200)">
        <rect width="660" height="820" rx="20" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
        
        <!-- Cabeçalho da Tabela -->
        <rect width="660" height="48" rx="20" fill="#1e293b"/>
        <g fill="#94a3b8" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
          <text x="30" y="30">#  CLUBE</text>
          <text x="360" y="30">P</text>
          <text x="420" y="30">J</text>
          <text x="480" y="30">V</text>
          <text x="540" y="30">E</text>
          <text x="600" y="30">SG</text>
        </g>

        <!-- Linhas 1 a 4: ZONA G4 (VERDE) -->
        <g font-family="Arial, sans-serif" font-size="15" font-weight="bold">
          <!-- 1º Lugar -->
          <rect y="50" width="660" height="70" fill="#10b981" fill-opacity="0.15"/>
          <line x1="0" y1="50" x2="6" y2="120" stroke="#10b981" stroke-width="8"/>
          <text x="30" y="92" fill="#10b981">1  Sampaio Corrêa</text>
          <text x="360" y="92" fill="#ffffff">28</text><text x="420" y="92" fill="#94a3b8">12</text><text x="480" y="92" fill="#94a3b8">9</text><text x="540" y="92" fill="#94a3b8">1</text><text x="600" y="92" fill="#10b981">+16</text>

          <!-- 2º Lugar -->
          <rect y="125" width="660" height="70" fill="#10b981" fill-opacity="0.1"/>
          <line x1="0" y1="125" x2="6" y2="195" stroke="#10b981" stroke-width="8"/>
          <text x="30" y="167" fill="#ffffff">2  Maranhão AC</text>
          <text x="360" y="167" fill="#ffffff">25</text><text x="420" y="167" fill="#94a3b8">12</text><text x="480" y="167" fill="#94a3b8">8</text><text x="540" y="167" fill="#94a3b8">1</text><text x="600" y="167" fill="#10b981">+12</text>

          <!-- 3º Lugar -->
          <rect y="200" width="660" height="70" fill="#10b981" fill-opacity="0.08"/>
          <line x1="0" y1="200" x2="6" y2="270" stroke="#10b981" stroke-width="8"/>
          <text x="30" y="242" fill="#ffffff">3  Moto Club</text>
          <text x="360" y="242" fill="#ffffff">22</text><text x="420" y="242" fill="#94a3b8">12</text><text x="480" y="242" fill="#94a3b8">6</text><text x="540" y="242" fill="#94a3b8">4</text><text x="600" y="242" fill="#10b981">+7</text>

          <!-- 4º Lugar -->
          <rect y="275" width="660" height="70" fill="#10b981" fill-opacity="0.05"/>
          <line x1="0" y1="275" x2="6" y2="345" stroke="#10b981" stroke-width="8"/>
          <text x="30" y="317" fill="#ffffff">4  Imperatriz</text>
          <text x="360" y="317" fill="#ffffff">20</text><text x="420" y="317" fill="#94a3b8">12</text><text x="480" y="317" fill="#94a3b8">6</text><text x="540" y="317" fill="#94a3b8">2</text><text x="600" y="317" fill="#10b981">+4</text>

          <!-- 5º Lugar (Neutro) -->
          <text x="30" y="392" fill="#ffffff">5  Cordino</text>
          <text x="360" y="392" fill="#ffffff">16</text><text x="420" y="392" fill="#94a3b8">12</text><text x="480" y="392" fill="#94a3b8">4</text><text x="540" y="392" fill="#94a3b8">4</text><text x="600" y="392" fill="#94a3b8">0</text>

          <!-- 6º Lugar (Neutro) -->
          <text x="30" y="467" fill="#ffffff">6  Tuntum</text>
          <text x="360" y="467" fill="#ffffff">13</text><text x="420" y="467" fill="#94a3b8">12</text><text x="480" y="467" fill="#94a3b8">3</text><text x="540" y="467" fill="#94a3b8">4</text><text x="600" y="467" fill="#ef4444">-4</text>

          <!-- 7º Lugar (ZONA Z2 REBAIXAMENTO) -->
          <rect y="500" width="660" height="70" fill="#ef4444" fill-opacity="0.12"/>
          <line x1="0" y1="500" x2="6" y2="570" stroke="#ef4444" stroke-width="8"/>
          <text x="30" y="542" fill="#fca5a5">7  Pinheiro AC</text>
          <text x="360" y="542" fill="#ffffff">9</text><text x="420" y="542" fill="#94a3b8">12</text><text x="480" y="542" fill="#94a3b8">2</text><text x="540" y="542" fill="#94a3b8">3</text><text x="600" y="542" fill="#ef4444">-8</text>

          <!-- 8º Lugar (ZONA Z2 REBAIXAMENTO) -->
          <rect y="575" width="660" height="70" fill="#ef4444" fill-opacity="0.15"/>
          <line x1="0" y1="575" x2="6" y2="645" stroke="#ef4444" stroke-width="8"/>
          <text x="30" y="617" fill="#fca5a5">8  Chapadinha</text>
          <text x="360" y="617" fill="#ffffff">4</text><text x="420" y="617" fill="#94a3b8">12</text><text x="480" y="617" fill="#94a3b8">1</text><text x="540" y="617" fill="#94a3b8">1</text><text x="600" y="617" fill="#ef4444">-17</text>
        </g>

        <!-- Legenda no Rodapé da Tabela -->
        <g transform="translate(30, 755)" font-family="Arial, sans-serif" font-size="13" font-weight="bold">
          <circle cx="10" cy="10" r="6" fill="#10b981"/>
          <text x="26" y="15" fill="#cbd5e1">Classificados para a Semifinal (G4)</text>
          <circle cx="380" cy="10" r="6" fill="#ef4444"/>
          <text x="396" y="15" fill="#cbd5e1">Rebaixamento para a 2ª Divisão (Z2)</text>
        </g>
      </g>
    `;
  }

  // 3. Screenshot 3: Escalações 50m Antes (Campinho com 11 Titulares)
  else if (asset.id === 'screenshot_3') {
    screenContent = `
      <!-- Status Bar -->
      <g fill="#94a3b8" font-size="16" font-family="Arial, sans-serif" font-weight="bold">
        <text x="40" y="32">16:45</text>
        <text x="680" y="32" text-anchor="end">5G  📶 100% 🔋</text>
      </g>

      <!-- Header do App -->
      <rect x="0" y="48" width="720" height="74" fill="${primary}"/>
      <text x="40" y="94" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="#ffffff">
        ESCALAÇÃO OFICIAL • 4-3-3
      </text>

      <!-- Card do Jogo e Estádio -->
      <g transform="translate(30, 135)">
        <rect width="660" height="60" rx="16" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
        <text x="30" y="38" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">
          Sampaio Corrêa vs Moto Club • Estádio Castelão
        </text>
      </g>

      <!-- CAMPO TÁTICO COMPLETO COM 11 TITULARES -->
      <g transform="translate(30, 210)">
        <!-- Gramado com Faixas de Corte -->
        <rect width="660" height="690" rx="20" fill="#0f5132" stroke="#198754" stroke-width="4"/>
        <rect y="86" width="660" height="86" fill="#146c43"/>
        <rect y="258" width="660" height="86" fill="#146c43"/>
        <rect y="430" width="660" height="86" fill="#146c43"/>
        <rect y="602" width="660" height="88" rx="20" fill="#146c43"/>

        <!-- Linhas Regulamentares do Campo -->
        <circle cx="330" cy="560" r="90" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.45"/>
        <line x1="0" y1="560" x2="660" y2="560" stroke="#ffffff" stroke-width="2" opacity="0.45"/>
        <rect x="180" y="0" width="300" height="150" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.45"/>
        <rect x="250" y="0" width="160" height="60" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.45"/>

        <!-- OS 11 TITULARES DISTRIBUÍDOS NO ESQUEMA 4-3-3 -->
        <!-- 1. Goleiro -->
        <g transform="translate(330, 50)" font-family="Arial, sans-serif" text-anchor="middle">
          <circle cx="0" cy="0" r="22" fill="#eab308" stroke="#ffffff" stroke-width="2"/>
          <text y="6" font-weight="900" font-size="14" fill="#000000">1</text>
          <text y="24" font-size="12" font-weight="bold" fill="#ffffff">Luiz Daniel</text>
        </g>

        <!-- 4 Defensores -->
        <g transform="translate(100, 160)" font-family="Arial, sans-serif" text-anchor="middle">
          <circle cx="0" cy="0" r="22" fill="${primary}" stroke="#ffffff" stroke-width="2"/>
          <text y="6" font-weight="900" font-size="14" fill="#ffffff">6</text>
          <text y="24" font-size="12" font-weight="bold" fill="#ffffff">Cortez</text>
        </g>
        <g transform="translate(250, 160)" font-family="Arial, sans-serif" text-anchor="middle">
          <circle cx="0" cy="0" r="22" fill="${primary}" stroke="#ffffff" stroke-width="2"/>
          <text y="6" font-weight="900" font-size="14" fill="#ffffff">3</text>
          <text y="24" font-size="12" font-weight="bold" fill="#ffffff">Fábio Aguiar</text>
        </g>
        <g transform="translate(410, 160)" font-family="Arial, sans-serif" text-anchor="middle">
          <circle cx="0" cy="0" r="22" fill="${primary}" stroke="#ffffff" stroke-width="2"/>
          <text y="6" font-weight="900" font-size="14" fill="#ffffff">4</text>
          <text y="24" font-size="12" font-weight="bold" fill="#ffffff">Franklin</text>
        </g>
        <g transform="translate(560, 160)" font-family="Arial, sans-serif" text-anchor="middle">
          <circle cx="0" cy="0" r="22" fill="${primary}" stroke="#ffffff" stroke-width="2"/>
          <text y="6" font-weight="900" font-size="14" fill="#ffffff">2</text>
          <text y="24" font-size="12" font-weight="bold" fill="#ffffff">Maurício</text>
        </g>

        <!-- 3 Meio-Campistas -->
        <g transform="translate(180, 290)" font-family="Arial, sans-serif" text-anchor="middle">
          <circle cx="0" cy="0" r="22" fill="${primary}" stroke="#ffffff" stroke-width="2"/>
          <text y="6" font-weight="900" font-size="14" fill="#ffffff">5</text>
          <text y="24" font-size="12" font-weight="bold" fill="#ffffff">Ferreira</text>
        </g>
        <g transform="translate(330, 310)" font-family="Arial, sans-serif" text-anchor="middle">
          <circle cx="0" cy="0" r="22" fill="${primary}" stroke="#ffffff" stroke-width="2"/>
          <text y="6" font-weight="900" font-size="14" fill="#ffffff">8</text>
          <text y="24" font-size="12" font-weight="bold" fill="#ffffff">Gazão</text>
        </g>
        <g transform="translate(480, 290)" font-family="Arial, sans-serif" text-anchor="middle">
          <circle cx="0" cy="0" r="22" fill="${primary}" stroke="#ffffff" stroke-width="2"/>
          <text y="6" font-weight="900" font-size="14" fill="#ffffff">10</text>
          <text y="24" font-size="12" font-weight="bold" fill="#ffffff">Eloir</text>
        </g>

        <!-- 3 Atacantes -->
        <g transform="translate(120, 440)" font-family="Arial, sans-serif" text-anchor="middle">
          <circle cx="0" cy="0" r="22" fill="${primary}" stroke="#ffffff" stroke-width="2"/>
          <text y="6" font-weight="900" font-size="14" fill="#ffffff">11</text>
          <text y="24" font-size="12" font-weight="bold" fill="#ffffff">Pimentinha</text>
        </g>
        <g transform="translate(330, 460)" font-family="Arial, sans-serif" text-anchor="middle">
          <circle cx="0" cy="0" r="22" fill="${primary}" stroke="#ffffff" stroke-width="2"/>
          <text y="6" font-weight="900" font-size="14" fill="#ffffff">9</text>
          <text y="24" font-size="12" font-weight="bold" fill="#ffffff">Ciel</text>
        </g>
        <g transform="translate(540, 440)" font-family="Arial, sans-serif" text-anchor="middle">
          <circle cx="0" cy="0" r="22" fill="${primary}" stroke="#ffffff" stroke-width="2"/>
          <text y="6" font-weight="900" font-size="14" fill="#ffffff">7</text>
          <text y="24" font-size="12" font-weight="bold" fill="#ffffff">Ytalo</text>
        </g>

        <!-- Placa no Gramado -->
        <rect x="220" y="630" width="220" height="38" rx="19" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
        <text x="330" y="654" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#10b981" text-anchor="middle">ESCALAÇÃO CONFIRMADA</text>
      </g>

      <!-- Banco de Reservas & Técnico -->
      <g transform="translate(30, 915)">
        <rect width="660" height="110" rx="18" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
        <text x="25" y="32" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#94a3b8">TÉCNICO &amp; BANCO DE RESERVAS</text>
        <text x="25" y="62" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#ffffff">Comandante Oficial</text>
        <text x="25" y="90" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Reservas: Matheus (GOL), Nadson, Gabriel, Rafael, Robson, Lucas, Bruno</text>
      </g>
    `;
  }

  // 4. Screenshot 4: Comentários Táticos com IA
  else if (asset.id === 'screenshot_4') {
    screenContent = `
      <!-- Status Bar -->
      <g fill="#94a3b8" font-size="16" font-family="Arial, sans-serif" font-weight="bold">
        <text x="40" y="32">16:45</text>
        <text x="680" y="32" text-anchor="end">5G  📶 100% 🔋</text>
      </g>

      <!-- Header do App -->
      <rect x="0" y="48" width="720" height="74" fill="${primary}"/>
      <text x="40" y="94" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="#ffffff">
        ANÁLISE TÁTICA &amp; IA COPILOT
      </text>

      <!-- Card Radar de Probabilidade -->
      <g transform="translate(30, 140)">
        <rect width="660" height="180" rx="22" fill="#0f172a" stroke="#8b5cf6" stroke-width="2"/>
        <text x="30" y="36" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#a78bfa">CHANCE DE VITÓRIA EM TEMPO REAL</text>
        
        <g transform="translate(30, 65)">
          <text x="0" y="20" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#10b981">62%</text>
          <text x="0" y="44" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">Mandante</text>

          <text x="260" y="20" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#eab308">24%</text>
          <text x="260" y="44" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">Empate</text>

          <text x="520" y="20" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#38bdf8">14%</text>
          <text x="520" y="44" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">Visitante</text>
        </g>
        <rect x="30" y="130" width="600" height="14" rx="7" fill="#1e293b"/>
        <rect x="30" y="130" width="372" height="14" rx="7" fill="#10b981"/>
        <rect x="402" y="130" width="144" height="14" fill="#eab308"/>
        <rect x="546" y="130" width="84" height="14" rx="7" fill="#38bdf8"/>
      </g>

      <!-- Card do Insight de IA -->
      <g transform="translate(30, 340)">
        <rect width="660" height="300" rx="22" fill="#1e1b4b" stroke="#8b5cf6" stroke-width="1.5"/>
        <rect x="30" y="25" width="140" height="30" rx="15" fill="#8b5cf6"/>
        <text x="100" y="45" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">✨ COPILOT IA</text>

        <text x="30" y="90" font-family="Arial, sans-serif" font-size="20" font-weight="900" fill="#ffffff">
          Pressão Ofensiva e Domínio das Ações
        </text>
        <text x="30" y="125" font-family="Arial, sans-serif" font-size="15" fill="#cbd5e1" leading="relaxed">
          O time da casa adiantou as linhas de marcação para o campo de ataque, explorando as costas dos laterais adversários com jogadas de velocidade de Pimentinha.
        </text>

        <rect x="30" y="225" width="600" height="46" rx="14" fill="#312e81"/>
        <text x="50" y="254" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#10b981">
          ✓ Índice de Agressividade Tática: 8.7 / 10 (Elevado)
        </text>
      </g>

      <!-- Feed de Lances Minuto a Minuto -->
      <g transform="translate(30, 660)">
        <text x="5" y="25" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#94a3b8">LINHA DO TEMPO DOS LANCES</text>
        
        <rect y="40" width="660" height="90" rx="18" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
        <text x="30" y="80" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#10b981">76' ⚽ GOL! Finalização no canto direito</text>
        <text x="30" y="105" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Assistência perfeita de Ferreira para Pimentinha</text>

        <rect y="145" width="660" height="90" rx="18" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
        <text x="30" y="185" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#eab308">68' 🟡 Cartão Amarelo por falta tática</text>
        <text x="30" y="210" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Árbitro pune zagueiro após interrupção de contra-ataque</text>
      </g>
    `;
  }

  // 5. Screenshot 5: Melhores Momentos & Vídeos dos Gols
  else {
    screenContent = `
      <!-- Status Bar -->
      <g fill="#94a3b8" font-size="16" font-family="Arial, sans-serif" font-weight="bold">
        <text x="40" y="32">16:45</text>
        <text x="680" y="32" text-anchor="end">5G  📶 100% 🔋</text>
      </g>

      <!-- Header do App -->
      <rect x="0" y="48" width="720" height="74" fill="${primary}"/>
      <text x="40" y="94" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="#ffffff">
        GOLS &amp; MELHORES MOMENTOS
      </text>

      <!-- PLAYER DE VÍDEO PRINCIPAL (16:9) -->
      <g transform="translate(30, 140)">
        <rect width="660" height="370" rx="22" fill="#0f172a" stroke="#334155" stroke-width="2"/>
        
        <!-- Fundo de Simulação de Campo/Gol -->
        <rect x="4" y="4" width="652" height="362" rx="18" fill="#064e3b" opacity="0.6"/>

        <!-- Botão Play Transparente Glassmorphism -->
        <circle cx="330" cy="185" r="46" fill="#ef4444" filter="drop-shadow(0 6px 12px rgba(239, 68, 68, 0.4))"/>
        <polygon points="320,165 352,185 320,205" fill="#ffffff"/>

        <!-- Duração do Vídeo -->
        <rect x="560" y="320" width="80" height="28" rx="8" fill="#000000" opacity="0.8"/>
        <text x="600" y="339" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">03:45</text>

        <!-- Título do Vídeo -->
        <rect x="0" y="295" width="550" height="60" rx="16" fill="#000000" opacity="0.75"/>
        <text x="25" y="332" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#ffffff">
          Gols da Rodada: Sampaio Corrêa 2 x 1 Moto Club
        </text>
      </g>

      <!-- LISTA DE VÍDEOS RECENTES -->
      <g transform="translate(30, 530)">
        <text x="5" y="25" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#94a3b8">LANCES E ENTREVISTAS</text>

        <!-- Vídeo 2 -->
        <rect y="40" width="660" height="110" rx="18" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
        <rect x="15" y="55" width="120" height="80" rx="12" fill="#1e293b"/>
        <polygon points="68,88 84,95 68,102" fill="#ef4444"/>
        <text x="155" y="82" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">
          Entrevista pós-jogo com o autor do gol da vitória
        </text>
        <text x="155" y="112" font-family="Arial, sans-serif" font-size="13" fill="#64748b">
          Assistir • 02:15 • Transmissão Oficial
        </text>

        <!-- Vídeo 3 -->
        <rect y="165" width="660" height="110" rx="18" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
        <rect x="15" y="180" width="120" height="80" rx="12" fill="#1e293b"/>
        <polygon points="68,213 84,220 68,227" fill="#ef4444"/>
        <text x="155" y="207" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">
          Melhores defesas do goleiro no clássico
        </text>
        <text x="155" y="237" font-family="Arial, sans-serif" font-size="13" fill="#64748b">
          Assistir • 01:50 • Defesas Espetaculares
        </text>
      </g>

      <!-- ARTILHARIA ATUALIZADA NO RODAPÉ -->
      <g transform="translate(30, 830)">
        <rect width="660" height="195" rx="20" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
        <text x="25" y="32" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#94a3b8">TOP ARTILHEIROS DO CAMPEONATO</text>
        
        <g font-family="Arial, sans-serif" font-size="15" font-weight="bold">
          <text x="25" y="70" fill="#ffffff">1. Pimentinha (Sampaio Corrêa)</text>
          <text x="620" y="70" fill="#10b981" text-anchor="end">8 Gols</text>

          <text x="25" y="115" fill="#ffffff">2. Ciel (Sampaio Corrêa)</text>
          <text x="620" y="115" fill="#10b981" text-anchor="end">7 Gols</text>

          <text x="25" y="160" fill="#ffffff">3. Waldir (Moto Club)</text>
          <text x="620" y="160" fill="#10b981" text-anchor="end">6 Gols</text>
        </g>
      </g>
    `;
  }

  // Montagem Completa do Mockup da Screenshot com Moldura Titânio/Prata e Bottom Bar
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
    <defs>
      <!-- Gradiente Profundo de Fundo da Screenshot -->
      <linearGradient id="bgScreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#020e24"/>
        <stop offset="40%" stop-color="#051a3d"/>
        <stop offset="100%" stop-color="#020814"/>
      </linearGradient>

      <!-- Sombra do Chassi do Celular -->
      <filter id="phoneShadow" x="-10%" y="-5%" width="120%" height="115%">
        <feDropShadow dx="0" dy="25" stdDeviation="30" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
    </defs>

    <!-- Fundo Geral da Imagem -->
    <rect width="1080" height="1920" fill="url(#bgScreenGrad)"/>

    <!-- TÍTULO E SUBTÍTULO ASO NO TOPO DA IMAGEM -->
    <g transform="translate(540, 120)" text-anchor="middle">
      <text font-family="'Outfit', 'Montserrat', 'Inter', Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff" letter-spacing="-1">
        ${asset.copyHeadline}
      </text>
      <text y="58" font-family="'Inter', Arial, sans-serif" font-size="28" font-weight="500" fill="#94a3b8">
        ${asset.copySubtitle}
      </text>
    </g>

    <!-- ========================================================= -->
    <!-- MOLDURA DO SMARTPHONE TITÂNIO/PRATA (REFERÊNCIA MODELO 3) -->
    <!-- ========================================================= -->
    <g transform="translate(150, 230)" filter="url(#phoneShadow)">
      <!-- Botões Laterais Físicos -->
      <rect x="-10" y="240" width="8" height="65" rx="3" fill="#94a3b8"/> <!-- Volume Up -->
      <rect x="-10" y="325" width="8" height="65" rx="3" fill="#94a3b8"/> <!-- Volume Down -->
      <rect x="782" y="270" width="8" height="95" rx="3" fill="#94a3b8"/> <!-- Power -->

      <!-- Chassi Externo Prata/Titânio -->
      <rect width="780" height="1620" rx="72" fill="#cbd5e1" stroke="#f1f5f9" stroke-width="4"/>
      <!-- Borda Interna com Chanfro Metálico -->
      <rect x="8" y="8" width="764" height="1604" rx="64" fill="#0f172a" stroke="#64748b" stroke-width="2"/>

      <!-- TELA DO SMARTPHONE (100% PREENCHIDA) -->
      <g transform="translate(30, 26)">
        <clipPath id="screenDisplayClip">
          <rect width="720" height="1568" rx="48"/>
        </clipPath>

        <g clip-path="url(#screenDisplayClip)">
          <!-- Fundo da Tela do App -->
          <rect width="720" height="1568" fill="#090d16"/>

          <!-- CONTEÚDO REAL DA TELA -->
          ${screenContent}

          <!-- BARRA DE NAVEGAÇÃO INFERIOR OFICIAL (BOTTOM BAR) -->
          <g transform="translate(0, 1490)">
            <rect width="720" height="78" fill="#0a0f1d" stroke="#1e293b" stroke-width="1"/>
            <g font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">
              <!-- Aba 1: Início -->
              <g transform="translate(72, 0)">
                <circle cx="0" cy="22" r="14" fill="${asset.id === 'screenshot_1' ? primary : 'transparent'}"/>
                <text y="26" font-size="16">⚽</text>
                <text y="54" fill="${asset.id === 'screenshot_1' ? '#ffffff' : '#64748b'}">Início</text>
              </g>
              <!-- Aba 2: Tabela -->
              <g transform="translate(216, 0)">
                <circle cx="0" cy="22" r="14" fill="${asset.id === 'screenshot_2' ? primary : 'transparent'}"/>
                <text y="26" font-size="16">🏆</text>
                <text y="54" fill="${asset.id === 'screenshot_2' ? '#ffffff' : '#64748b'}">Tabela</text>
              </g>
              <!-- Aba 3: Notícias -->
              <g transform="translate(360, 0)">
                <circle cx="0" cy="22" r="14" fill="${asset.id === 'screenshot_4' ? primary : 'transparent'}"/>
                <text y="26" font-size="16">📰</text>
                <text y="54" fill="${asset.id === 'screenshot_4' ? '#ffffff' : '#64748b'}">Notícias</text>
              </g>
              <!-- Aba 4: Vídeos -->
              <g transform="translate(504, 0)">
                <circle cx="0" cy="22" r="14" fill="${asset.id === 'screenshot_5' ? primary : 'transparent'}"/>
                <text y="26" font-size="16">📺</text>
                <text y="54" fill="${asset.id === 'screenshot_5' ? '#ffffff' : '#64748b'}">Vídeos</text>
              </g>
              <!-- Aba 5: Ajustes -->
              <g transform="translate(648, 0)">
                <circle cx="0" cy="22" r="14" fill="transparent"/>
                <text y="26" font-size="16">⚙️</text>
                <text y="54" fill="#64748b">Ajustes</text>
              </g>
            </g>

            <!-- Barra Home do Sistema -->
            <rect x="270" y="66" width="180" height="4" rx="2" fill="#ffffff" opacity="0.5"/>
          </g>
        </g>
      </g>

      <!-- NOTCH / DYNAMIC ISLAND COM CÂMERA E ALTO-FALANTE -->
      <g transform="translate(280, 32)">
        <rect width="220" height="34" rx="17" fill="#000000"/>
        <circle cx="175" cy="17" r="6" fill="#1e293b"/>
        <rect x="75" y="14" width="60" height="6" rx="3" fill="#1e293b"/>
      </g>
    </g>
  </svg>`;
}


